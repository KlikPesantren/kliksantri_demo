import { RESERVED_SUBDOMAINS, ROOT_DOMAIN } from "./hostnameRouting.js";

export function normalizeTenantDomainHostname(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized || /\s/.test(normalized) || normalized.includes("://")) return null;
  const suffix = `.${ROOT_DOMAIN}`;
  if (!normalized.endsWith(suffix)) return null;
  const slug = normalized.slice(0, -suffix.length);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || RESERVED_SUBDOMAINS.has(slug)) return null;
  return normalized;
}

export function getActiveTenantUrl(domain) {
  if (domain?.overall_status !== "active") return null;
  const hostname = normalizeTenantDomainHostname(domain.hostname);
  return hostname ? `https://${hostname}` : null;
}

export async function copyActiveTenantUrl(domain, { clipboard, fallbackCopy } = {}) {
  const url = getActiveTenantUrl(domain);
  if (!url) throw new Error("URL tenant tidak valid atau belum aktif");
  try {
    if (!clipboard?.writeText) throw new Error("Clipboard API tidak tersedia");
    await clipboard.writeText(url);
    return { url, method: "clipboard" };
  } catch (clipboardError) {
    if (fallbackCopy && await fallbackCopy(url)) return { url, method: "fallback" };
    throw clipboardError;
  }
}
