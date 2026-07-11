const API_BASE = "https://api.cloudflare.com/client/v4";
const RESERVED_HOSTNAMES = new Set([
  "www", "app", "platform", "api", "docs", "status", "admin", "default", "root", "system",
]);

function assertTenantHostname(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase().replace(/\.$/, "");
  const match = normalized.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\.klikpesantren\.com$/);
  if (!match || RESERVED_HOSTNAMES.has(match[1])) {
    const error = new Error("Hostname tenant tidak valid"); error.code = "DNS_HOSTNAME_INVALID"; error.status = 400; throw error;
  }
  return normalized;
}

function readConfig(env = process.env) {
  return {
    token: String(env.CLOUDFLARE_API_TOKEN || "").trim(),
    zoneId: String(env.CLOUDFLARE_ZONE_ID || "").trim(),
    target: String(env.TENANT_DOMAIN_TARGET || "").trim().toLowerCase().replace(/\.$/, ""),
    dryRun: String(env.CLOUDFLARE_DNS_DRY_RUN || "").trim().toLowerCase() === "true",
  };
}

function normalizeCloudflareError(error) {
  if (error?.code === "DNS_TARGET_CONFLICT") return "Record DNS sudah ada dengan target berbeda";
  if (error?.code === "DNS_RECORD_NOT_FOUND") return "Record DNS tenant tidak ditemukan";
  if (error?.name === "AbortError") return "Cloudflare tidak merespons tepat waktu";
  if (error?.status === 401 || error?.status === 403) return "Autentikasi Cloudflare ditolak";
  if (error?.status === 429) return "Batas permintaan Cloudflare tercapai";
  return "Operasi DNS Cloudflare gagal";
}

function assertConfig(config) {
  if (!config.target) {
    const error = new Error("TENANT_DOMAIN_TARGET belum dikonfigurasi");
    error.code = "DNS_CONFIG_INVALID";
    error.status = 503;
    throw error;
  }
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(config.target)) {
    const error = new Error("TENANT_DOMAIN_TARGET tidak valid"); error.code = "DNS_CONFIG_INVALID"; error.status = 503; throw error;
  }
  if (!config.dryRun && (!config.token || !config.zoneId)) {
    const error = new Error("Konfigurasi Cloudflare belum lengkap");
    error.code = "DNS_CONFIG_INVALID";
    error.status = 503;
    throw error;
  }
}

function createCloudflareDnsService({ fetchImpl = global.fetch, env = process.env } = {}) {
  const config = readConfig(env);

  async function request(path, options = {}) {
    assertConfig(config);
    const response = await fetchImpl(`${API_BASE}/zones/${config.zoneId}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    let body = null;
    try { body = await response.json(); } catch { body = null; }
    if (!response.ok || body?.success === false) {
      const error = new Error("Cloudflare request failed");
      error.status = response.status;
      error.providerErrors = body?.errors?.map((item) => item?.code).filter(Boolean) || [];
      throw error;
    }
    return body?.result;
  }

  async function getDnsRecord(hostname) {
    hostname = assertTenantHostname(hostname);
    assertConfig(config);
    if (config.dryRun) return null;
    const query = new URLSearchParams({ type: "CNAME", name: hostname, per_page: "100" });
    const records = await request(`/dns_records?${query.toString()}`);
    return (records || []).find((record) => record.name?.toLowerCase() === hostname.toLowerCase()) || null;
  }

  async function verifyTenantDnsRecord(hostname) {
    hostname = assertTenantHostname(hostname);
    const record = await getDnsRecord(hostname);
    if (!record) return { exists: false, matches: false, record: null, dryRun: config.dryRun };
    const actualTarget = String(record.content || "").toLowerCase().replace(/\.$/, "");
    return { exists: true, matches: actualTarget === config.target, record, dryRun: false };
  }

  async function createTenantCname(hostname) {
    hostname = assertTenantHostname(hostname);
    assertConfig(config);
    if (config.dryRun) {
      return { id: `dry-run:${hostname}`, name: hostname, content: config.target, type: "CNAME", proxied: false, dryRun: true };
    }
    const existing = await verifyTenantDnsRecord(hostname);
    if (existing.exists) {
      if (!existing.matches) {
        const error = new Error("DNS target conflict"); error.code = "DNS_TARGET_CONFLICT"; error.status = 409; throw error;
      }
      return { ...existing.record, reused: true };
    }
    return request("/dns_records", {
      method: "POST",
      body: JSON.stringify({ type: "CNAME", name: hostname, content: config.target, ttl: 1, proxied: false }),
    });
  }

  async function deleteTenantDnsRecord(hostname) {
    hostname = assertTenantHostname(hostname);
    assertConfig(config);
    if (config.dryRun) return { id: `dry-run:${hostname}`, dryRun: true, deleted: false };
    const existing = await verifyTenantDnsRecord(hostname);
    if (!existing.exists) return { deleted: false, missing: true };
    if (!existing.matches) {
      const error = new Error("DNS target conflict"); error.code = "DNS_TARGET_CONFLICT"; error.status = 409; throw error;
    }
    await request(`/dns_records/${encodeURIComponent(existing.record.id)}`, { method: "DELETE" });
    return { id: existing.record.id, deleted: true };
  }

  return {
    createTenantCname, getDnsRecord, deleteTenantDnsRecord, verifyTenantDnsRecord,
    normalizeCloudflareError, config: { target: config.target, dryRun: config.dryRun },
  };
}

const defaultService = createCloudflareDnsService();
module.exports = { ...defaultService, createCloudflareDnsService, normalizeCloudflareError };
