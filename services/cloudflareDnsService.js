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
  const dryRunRaw = String(env.CLOUDFLARE_DNS_DRY_RUN || "").trim().toLowerCase();
  return {
    token: String(env.CLOUDFLARE_API_TOKEN || "").trim(),
    zoneId: String(env.CLOUDFLARE_ZONE_ID || "").trim(),
    target: String(env.TENANT_DOMAIN_TARGET || "").trim().toLowerCase().replace(/\.$/, ""),
    dryRun: dryRunRaw === "true",
    dryRunRaw,
  };
}

function isValidTargetHostname(target) {
  const normalized = String(target || "");
  if (!normalized || normalized.length > 253 || normalized.indexOf(".") === -1) return false;
  return normalized.split(".").every(
    (label) => label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  );
}

function getCloudflareStartupValidation(env = process.env, fetchImpl = global.fetch) {
  const config = readConfig(env);
  return {
    tokenConfigured: Boolean(config.token),
    zoneIdConfigured: Boolean(config.zoneId),
    targetConfigured: Boolean(config.target),
    targetValid: Boolean(config.target) && isValidTargetHostname(config.target),
    dryRunEnabled: config.dryRun,
    dryRunValueValid: config.dryRunRaw === "" || config.dryRunRaw === "true" || config.dryRunRaw === "false",
    fetchAvailable: typeof fetchImpl === "function",
    ready: typeof fetchImpl === "function" && Boolean(config.target) && isValidTargetHostname(config.target) && (config.dryRun || Boolean(config.token && config.zoneId)),
  };
}

function logCloudflareStartupValidation(env = process.env) {
  const validation = getCloudflareStartupValidation(env);
  const level = validation.ready && validation.dryRunValueValid ? "info" : "warn";
  console[level]("[cloudflare-dns-config]", validation);
  return validation;
}

function sanitizeProviderBody(value, secrets = [], depth = 0) {
  if (depth > 5) return "[truncated]";
  if (value == null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") {
    let sanitized = value.slice(0, 2000);
    for (const secret of secrets.filter(Boolean)) sanitized = sanitized.split(secret).join("[redacted]");
    return sanitized;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeProviderBody(item, secrets, depth + 1));
  if (typeof value === "object") {
    const result = {};
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      if (/token|authorization|secret|password|api[_-]?key|cookie/i.test(key)) result[key] = "[redacted]";
      else result[key] = sanitizeProviderBody(item, secrets, depth + 1);
    }
    return result;
  }
  return String(value).slice(0, 500);
}

function normalizeCloudflareError(error) {
  if (error?.code === "DNS_TARGET_CONFLICT") return "Record DNS sudah ada dengan target berbeda";
  if (error?.code === "DNS_RECORD_NOT_FOUND") return "Record DNS tenant tidak ditemukan";
  if (error?.timedOut || error?.name === "AbortError") return "Cloudflare tidak merespons tepat waktu";
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
  if (!isValidTargetHostname(config.target)) {
    const error = new Error("TENANT_DOMAIN_TARGET tidak valid"); error.code = "DNS_CONFIG_INVALID"; error.status = 503; throw error;
  }
  if (!config.dryRun && (!config.token || !config.zoneId)) {
    const error = new Error("Konfigurasi Cloudflare belum lengkap");
    error.code = "DNS_CONFIG_INVALID";
    error.status = 503;
    throw error;
  }
}

function createCloudflareDnsService({ fetchImpl = global.fetch, env = process.env, timeoutMs = 12_000 } = {}) {
  const config = readConfig(env);

  async function request(path, options = {}) {
    assertConfig(config);
    if (typeof fetchImpl !== "function") {
      const error = new Error("Global fetch tidak tersedia pada runtime Node");
      error.code = "DNS_FETCH_UNAVAILABLE";
      error.status = 503;
      throw error;
    }
    const requestUrl = new URL(`${API_BASE}/zones/${encodeURIComponent(config.zoneId)}${path}`);
    const safeEndpoint = path.startsWith("/dns_records")
      ? "/zones/{zone_id}/dns_records"
      : "/zones/{zone_id}";
    const controller = new AbortController();
    let timeoutTriggered = false;
    const timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      controller.abort();
    }, timeoutMs);
    let response;
    try {
      response = await fetchImpl(requestUrl.href, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
    } catch (cause) {
      const error = new Error("Cloudflare network request failed", { cause });
      error.name = cause?.name || "CloudflareNetworkError";
      error.code = cause?.code || null;
      error.safeCauseMessage = sanitizeProviderBody(cause?.message || null, [config.token, config.zoneId]);
      error.cloudflareEndpoint = safeEndpoint;
      error.requestOrigin = requestUrl.origin;
      error.providerStatus = null;
      error.providerErrors = [];
      error.providerMessages = [];
      error.sanitizedProviderBody = null;
      error.timedOut = timeoutTriggered || cause?.name === "AbortError";
      error.aborted = controller.signal.aborted;
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    let body = null;
    try { body = await response.json(); } catch { body = null; }
    if (!response.ok || body?.success === false) {
      const error = new Error("Cloudflare request failed");
      error.status = response.status;
      error.providerStatus = response.status;
      error.cloudflareEndpoint = safeEndpoint;
      error.requestOrigin = requestUrl.origin;
      error.providerErrors = body?.errors?.map((item) => item?.code).filter((code) => code != null) || [];
      error.providerMessages = body?.errors?.map((item) => item?.message).filter(Boolean).map((message) => sanitizeProviderBody(message, [config.token])) || [];
      error.sanitizedProviderBody = sanitizeProviderBody(body, [config.token]);
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
module.exports = {
  ...defaultService,
  createCloudflareDnsService,
  normalizeCloudflareError,
  getCloudflareStartupValidation,
  logCloudflareStartupValidation,
  sanitizeProviderBody,
};
