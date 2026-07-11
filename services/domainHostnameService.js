const net = require("net");
const PLATFORM_ROOT = "klikpesantren.com";
const RESERVED = new Set(["localhost", "local", "internal", "example", "invalid", "test"]);

function normalizeDnsHostname(value) {
  const raw = String(value || "");
  if (!raw || raw !== raw.trim() || /[\s\u0000-\u001F\u007F]/.test(raw)) return null;
  if (raw.includes("://") || /[/?#@]/.test(raw) || raw.includes(":")) return null;
  const hostname = raw.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname.length > 253 || hostname.startsWith("*.") || net.isIP(hostname)) return null;
  const labels = hostname.split(".");
  if (labels.length < 2 || labels.some((label) => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return null;
  if (RESERVED.has(labels[labels.length - 1]) || hostname === "localhost") return null;
  return hostname;
}

function validateCustomDomainHostname(value) {
  const hostname = normalizeDnsHostname(value);
  if (!hostname) { const error = new Error("Hostname custom domain tidak valid"); error.status = 400; throw error; }
  if (hostname === PLATFORM_ROOT || hostname.endsWith(`.${PLATFORM_ROOT}`)) {
    const error = new Error("Domain klikpesantren.com harus menggunakan flow platform subdomain"); error.status = 400; throw error;
  }
  return hostname;
}

module.exports = { normalizeDnsHostname, validateCustomDomainHostname };

