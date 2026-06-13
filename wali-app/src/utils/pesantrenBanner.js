export function normalizeTenantProfile(raw) {
  if (!raw) return null;

  return {
    ...raw,
    logo_url: raw.logo_url ?? null,
    banner_url: raw.banner_url ?? null,
    banner_active: raw.banner_active !== false,
  };
}

export function isBannerVisible(profile) {
  const normalized = normalizeTenantProfile(profile);
  if (!normalized) return false;
  if (normalized.banner_active === false) return false;
  return Boolean(normalized.banner_url?.trim());
}

export function shouldShowPesantrenBanner(profil) {
  return isBannerVisible(profil);
}
