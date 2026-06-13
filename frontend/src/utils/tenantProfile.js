export const TENANT_CACHE_KEY = "kliksantri_tenant_profile";

export const TENANT_FALLBACKS = {
  name: "Pesantren",
  address: "Lengkapi profil pesantren",
};

export function normalizeTenantProfile(profile) {
  if (!profile) return null;

  return {
    ...profile,
    logo_url: profile.logo_url ?? null,
    banner_url: profile.banner_url ?? null,
    banner_active: profile.banner_active !== false,
  };
}

export function getCachedTenantProfile() {
  try {
    const raw = localStorage.getItem(TENANT_CACHE_KEY);
    return raw ? normalizeTenantProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function setCachedTenantProfile(profile) {
  if (!profile) {
    localStorage.removeItem(TENANT_CACHE_KEY);
    return;
  }
  localStorage.setItem(
    TENANT_CACHE_KEY,
    JSON.stringify(normalizeTenantProfile(profile)),
  );
}

export function resolveTenantDisplay(profile) {
  const normalized = normalizeTenantProfile(profile);
  const name = normalized?.nama_pesantren?.trim() || TENANT_FALLBACKS.name;
  const address = normalized?.alamat?.trim() || TENANT_FALLBACKS.address;
  const logo = normalized?.logo_url?.trim() || null;
  const banner_url = normalized?.banner_url?.trim() || null;
  const banner_active = normalized?.banner_active !== false;

  return {
    name,
    address,
    logo,
    banner_url,
    banner_active,
    hasCustomName: Boolean(normalized?.nama_pesantren?.trim()),
  };
}

export function getTenantInitial(name = "") {
  const trimmed = name.trim();
  if (!trimmed) return "P";
  return trimmed.charAt(0).toUpperCase();
}

export function isBannerVisible(profile) {
  const normalized = normalizeTenantProfile(profile);
  if (!normalized) return false;
  if (normalized.banner_active === false) return false;
  return Boolean(normalized.banner_url?.trim());
}
