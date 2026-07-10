import {
  LAST_TENANT_SLUG_KEY,
  normalizeTenantSlugInput,
} from "./tenantProfile";
import { getCurrentHostnameRoute } from "./hostnameRouting";

/** Query key for tenant slug on login page: /?tenant=anwarul-huda */
export const TENANT_LOGIN_QUERY_KEY = "tenant";

export function buildTenantLoginUrl(slug) {
  const normalized = normalizeTenantSlugInput(slug);
  if (!normalized) return "/";

  const hostnameRoute = getCurrentHostnameRoute();
  if (hostnameRoute.type !== "local" && hostnameRoute.type !== "preview") {
    return `https://${normalized}.klikpesantren.com`;
  }

  const params = new URLSearchParams({ [TENANT_LOGIN_QUERY_KEY]: normalized });
  return `/?${params.toString()}`;
}

export function stageTenantSlugForLogin(slug) {
  const normalized = normalizeTenantSlugInput(slug);
  if (!normalized) return null;

  localStorage.setItem(LAST_TENANT_SLUG_KEY, normalized);
  return normalized;
}

/**
 * Open tenant admin login in a new tab with slug prefilled.
 * Does not touch platform_token or perform auto-login.
 */
export function openTenantAdminPortal(slug, { newTab = true } = {}) {
  const normalized = normalizeTenantSlugInput(slug);
  if (!normalized) return false;

  const url = buildTenantLoginUrl(normalized);

  if (newTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.assign(url);
  }

  return true;
}
