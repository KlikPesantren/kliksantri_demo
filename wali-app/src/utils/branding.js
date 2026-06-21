const DEFAULT_TAGLINE = 'Portal Wali Santri';
const DEFAULT_NAME = 'Pesantren';

function trimUrl(value) {
  const v = typeof value === 'string' ? value.trim() : value?.toString?.()?.trim?.();
  return v || null;
}

/** Raw logo path from profil pesantren — hero / branding priority order. */
export function pickPesantrenLogoPath(pesantren) {
  if (!pesantren) return null;
  return (
    trimUrl(pesantren.logo_url) ||
    trimUrl(pesantren.logo) ||
    trimUrl(pesantren.icon_url) ||
    trimUrl(pesantren.splash_logo_url) ||
    trimUrl(pesantren.app_icon_url) ||
    null
  );
}

/** Raw banner path — Admin preview & Wali hero both use banner_url. */
export function pickPesantrenBannerPath(pesantren) {
  if (!pesantren) return null;
  if (pesantren.banner_active === false) return null;
  return trimUrl(pesantren.banner_url);
}

/** Cache-bust token for media URLs — production uses updated_at; dev falls back to now. */
export function resolveProfilCacheBust(pesantren) {
  const updatedAt = pesantren?.updated_at;
  if (updatedAt != null && updatedAt !== '') return updatedAt;
  if (__DEV__) return Date.now();
  return undefined;
}

export function resolveSplashLogoUrl(branding) {
  if (!branding) return null;
  return trimUrl(branding.splash_logo_url) || trimUrl(branding.logo_url);
}

export function resolveLoginLogoUrl(branding) {
  if (!branding) return null;
  return (
    trimUrl(branding.splash_logo_url) ||
    trimUrl(branding.logo_url)
  );
}

export function resolveAppIconUrl(branding) {
  if (!branding) return null;
  return trimUrl(branding.app_icon_url) || trimUrl(branding.logo_url);
}

export function resolveBrandingName(branding) {
  return branding?.nama_pesantren?.trim() || DEFAULT_NAME;
}

export function resolveBrandingTagline(branding, fallback = DEFAULT_TAGLINE) {
  return branding?.tagline?.trim() || fallback;
}

export function normalizeBrandingCache(profil) {
  if (!profil) return null;

  return {
    nama_pesantren: profil.nama_pesantren ?? null,
    logo_url: profil.logo_url ?? null,
    splash_logo_url: profil.splash_logo_url ?? null,
    app_icon_url: profil.app_icon_url ?? null,
    tagline: profil.tagline ?? null,
    alamat: profil.alamat ?? null,
    banner_url: profil.banner_url ?? null,
    banner_active: profil.banner_active !== false,
    tentang: profil.tentang ?? null,
    updated_at: profil.updated_at ?? null,
  };
}
