const API_BASE = "https://api.vercel.com";
const { normalizeDnsHostname } = require("./domainHostnameService");

function validateHostname(hostname) {
  const normalized = normalizeDnsHostname(hostname);
  if (!normalized) { const error = new Error("Hostname tenant tidak valid"); error.status = 400; throw error; }
  return normalized;
}

function readConfig(env = process.env) {
  const dryRaw = String(env.VERCEL_DOMAIN_DRY_RUN || "").trim().toLowerCase();
  return {
    token: String(env.VERCEL_API_TOKEN || "").trim(), projectId: String(env.VERCEL_PROJECT_ID || "").trim(),
    teamId: String(env.VERCEL_TEAM_ID || "").trim(), dryRun: dryRaw === "true", dryRaw,
  };
}

function isValidIdentifier(value) {
  return /^[A-Za-z0-9_-]+$/.test(String(value || ""));
}

function isValidToken(value) {
  const token = String(value || "");
  return Boolean(token) && token.length <= 2048 && !/[\s\u0000-\u001F\u007F]/.test(token);
}

function getVercelStartupValidation(env = process.env, fetchImpl = global.fetch) {
  const config = readConfig(env);
  const dryRunValueValid = config.dryRaw === "" || config.dryRaw === "true" || config.dryRaw === "false";
  const fetchAvailable = typeof fetchImpl === "function";
  const credentialsValid = isValidToken(config.token) && isValidIdentifier(config.projectId) && (!config.teamId || isValidIdentifier(config.teamId));
  return {
    tokenConfigured: Boolean(config.token),
    projectIdConfigured: Boolean(config.projectId),
    teamIdConfigured: Boolean(config.teamId),
    dryRunEnabled: config.dryRun,
    dryRunValueValid,
    fetchAvailable,
    ready: fetchAvailable && dryRunValueValid && (config.dryRun || credentialsValid),
  };
}

function logVercelStartupValidation(env = process.env) {
  const validation = getVercelStartupValidation(env);
  console[validation.ready ? "info" : "warn"]("[vercel-domain-config]", validation);
  return validation;
}

function sanitize(value, secrets = [], depth = 0) {
  if (depth > 5) return "[truncated]";
  if (value == null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") { let result = value.slice(0, 2000); for (const secret of secrets.filter(Boolean)) result = result.split(secret).join("[redacted]"); return result; }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, secrets, depth + 1));
  const result = {};
  for (const [key, item] of Object.entries(value).slice(0, 40)) result[key] = /token|authorization|secret|password|cookie/i.test(key) ? "[redacted]" : sanitize(item, secrets, depth + 1);
  return result;
}

function normalizeVercelError(error) {
  if (error?.timedOut) return "Vercel tidak merespons tepat waktu";
  if (error?.status === 401 || error?.status === 403) return "Autentikasi Vercel ditolak";
  if (error?.status === 404) return "Domain Vercel tidak ditemukan";
  if (error?.status === 429) return "Batas permintaan Vercel tercapai";
  return "Operasi domain Vercel gagal";
}

function createVercelDomainService({ fetchImpl = global.fetch, env = process.env, timeoutMs = 12_000 } = {}) {
  const config = readConfig(env);
  function assertConfig() {
    if (config.token && !isValidToken(config.token)) { const error = new Error("Format VERCEL_API_TOKEN tidak valid"); error.status = 503; throw error; }
    if (config.projectId && !isValidIdentifier(config.projectId)) { const error = new Error("Format VERCEL_PROJECT_ID tidak valid"); error.status = 503; throw error; }
    if (config.teamId && !isValidIdentifier(config.teamId)) { const error = new Error("Format VERCEL_TEAM_ID tidak valid"); error.status = 503; throw error; }
    if (!config.dryRun && (!config.token || !config.projectId)) { const error = new Error("Konfigurasi Vercel belum lengkap"); error.status = 503; throw error; }
    if (typeof fetchImpl !== "function") { const error = new Error("Global fetch tidak tersedia"); error.status = 503; throw error; }
  }
  function teamQuery() { return config.teamId ? `?teamId=${encodeURIComponent(config.teamId)}` : ""; }

  async function request(path, options = {}, { allow404 = false } = {}) {
    assertConfig();
    const url = new URL(`${API_BASE}${path}`);
    const safePath = url.pathname
      .replace(encodeURIComponent(config.projectId), "{project_id}");
    const safeEndpoint = safePath || "/";
    const controller = new AbortController(); let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    let response;
    try {
      response = await fetchImpl(url.href, { ...options, signal: controller.signal, headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" } });
    } catch (cause) {
      const error = new Error("Vercel network request failed", { cause });
      error.timedOut = timedOut || cause?.name === "AbortError"; error.aborted = controller.signal.aborted;
      error.status = null; error.providerCode = cause?.code || null; error.vercelEndpoint = safeEndpoint;
      error.requestOrigin = url.origin; error.networkErrorName = cause?.name || null;
      error.networkErrorCode = cause?.code || null;
      error.safeCauseMessage = sanitize(cause?.message || null, [config.token, config.projectId, config.teamId]);
      throw error;
    } finally { clearTimeout(timer); }
    let body = null; try { body = await response.json(); } catch { body = null; }
    if (allow404 && response.status === 404) return null;
    if (!response.ok) {
      const error = new Error("Vercel API request failed"); error.status = response.status;
      error.vercelEndpoint = safeEndpoint; error.requestOrigin = url.origin;
      error.providerCode = body?.error?.code || null; error.providerMessage = sanitize(body?.error?.message || null, [config.token, config.projectId, config.teamId]);
      error.sanitizedProviderBody = sanitize(body, [config.token, config.projectId, config.teamId]); throw error;
    }
    return body;
  }

  async function getDomain(hostname) {
    hostname = validateHostname(hostname); assertConfig();
    if (config.dryRun) return null;
    return request(`/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(hostname)}${teamQuery()}`, {}, { allow404: true });
  }
  async function addDomain(hostname) {
    hostname = validateHostname(hostname); assertConfig();
    if (config.dryRun) return { name: hostname, verified: false, dryRun: true };
    const existing = await getDomain(hostname); if (existing) return { ...existing, reused: true };
    try {
      return await request(`/v10/projects/${encodeURIComponent(config.projectId)}/domains${teamQuery()}`, { method: "POST", body: JSON.stringify({ name: hostname }) });
    } catch (error) {
      if (error.providerCode === "not_modified") { const found = await getDomain(hostname); if (found) return { ...found, reused: true }; }
      throw error;
    }
  }
  async function verifyDomain(hostname) {
    hostname = validateHostname(hostname); assertConfig();
    if (config.dryRun) return { name: hostname, verified: false, dryRun: true };
    return request(`/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(hostname)}/verify${teamQuery()}`, { method: "POST" });
  }
  async function removeDomain(hostname) {
    hostname = validateHostname(hostname); assertConfig();
    if (config.dryRun) return { name: hostname, removed: false, dryRun: true };
    const existing = await getDomain(hostname); if (!existing) return { name: hostname, removed: false, missing: true };
    await request(`/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(hostname)}${teamQuery()}`, { method: "DELETE" });
    return { name: hostname, removed: true };
  }
  async function getDomainConfig(hostname) {
    hostname = validateHostname(hostname); assertConfig();
    if (config.dryRun) return { misconfigured: true, dryRun: true };
    return request(`/v6/domains/${encodeURIComponent(hostname)}/config${teamQuery()}`);
  }
  function firstRequirement(value) {
    const item = Array.isArray(value) ? value[0] : value;
    return typeof item === "string" ? item : item?.value || item?.content || null;
  }
  async function getDnsInstructions(hostname) {
    hostname = validateHostname(hostname);
    const domainConfig = await getDomainConfig(hostname);
    if (domainConfig?.dryRun) return { status: "pending", records: [], dryRun: true };
    const cname = firstRequirement(domainConfig?.recommendedCNAME);
    const ipv4 = firstRequirement(domainConfig?.recommendedIPv4);
    const records = [];
    if (cname) records.push({ type: "CNAME", name: hostname, value: cname, proxy: "DNS only" });
    else if (ipv4) records.push({ type: "A", name: hostname, value: ipv4, proxy: "DNS only" });
    return { status: domainConfig?.misconfigured === false ? "active" : "pending", records, dryRun: false };
  }
  async function checkSsl(hostname) {
    const domain = await getDomain(hostname);
    if (config.dryRun) return { status: "issuing", ready: false, dryRun: true };
    if (!domain?.verified) return { status: "issuing", ready: false };
    const domainConfig = await getDomainConfig(hostname);
    return { status: domainConfig?.misconfigured === false ? "active" : "issuing", ready: domainConfig?.misconfigured === false, domain, domainConfig };
  }

  return { addDomain, verifyDomain, getDomain, removeDomain, getDomainConfig, getDnsInstructions, checkSsl, normalizeVercelError, config: { dryRun: config.dryRun } };
}

module.exports = {
  ...createVercelDomainService(), createVercelDomainService, normalizeVercelError,
  getVercelStartupValidation, logVercelStartupValidation,
};
