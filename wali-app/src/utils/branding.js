const DEFAULT_TAGLINE = 'Portal Wali Santri';
const DEFAULT_NAME = 'Pesantren';

function trimUrl(value) {
  const v = value?.trim();
  return v || null;
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
  };
}
