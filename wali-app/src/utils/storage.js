import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'wali_token',
  WALI: 'wali_data',
  ANAK: 'wali_anak',
  SANTRI_IDS: 'wali_santri_ids',
  ACTIVE_SANTRI: 'active_santri_id',
  TENANT_SLUG: 'wali_tenant_slug',
  PESANTREN_BRANDING: 'pesantren_branding',
};

export const storage = {
  async saveSession(token, wali, anak, santriIds, tenantSlug) {
    const pairs = [
      [KEYS.TOKEN, token],
      [KEYS.WALI, JSON.stringify(wali)],
      [KEYS.ANAK, JSON.stringify(anak)],
      [KEYS.SANTRI_IDS, JSON.stringify(santriIds)],
    ];
    if (tenantSlug) {
      pairs.push([KEYS.TENANT_SLUG, tenantSlug]);
    }
    await AsyncStorage.multiSet(pairs);
  },

  async getToken() {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },

  async getWali() {
    const raw = await AsyncStorage.getItem(KEYS.WALI);
    return raw ? JSON.parse(raw) : null;
  },

  async getAnak() {
    const raw = await AsyncStorage.getItem(KEYS.ANAK);
    return raw ? JSON.parse(raw) : [];
  },

  async getSantriIds() {
    const raw = await AsyncStorage.getItem(KEYS.SANTRI_IDS);
    return raw ? JSON.parse(raw) : [];
  },

  async getActiveSantriId() {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_SANTRI);
    return raw ? Number(raw) : null;
  },

  async setActiveSantriId(id) {
    await AsyncStorage.setItem(KEYS.ACTIVE_SANTRI, String(id));
  },

  async getTenantSlug() {
    const slug = await AsyncStorage.getItem(KEYS.TENANT_SLUG);
    return slug || 'default';
  },

  async setTenantSlug(slug) {
    if (slug) {
      await AsyncStorage.setItem(KEYS.TENANT_SLUG, slug);
    }
  },

  async clearSession() {
    await AsyncStorage.multiRemove([
      KEYS.TOKEN,
      KEYS.WALI,
      KEYS.ANAK,
      KEYS.SANTRI_IDS,
      KEYS.ACTIVE_SANTRI,
      KEYS.TENANT_SLUG,
    ]);
  },

  async savePesantrenBranding(profil) {
    const payload = {
      nama_pesantren: profil.nama_pesantren,
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
    await AsyncStorage.setItem(KEYS.PESANTREN_BRANDING, JSON.stringify(payload));
  },

  async getPesantrenBranding() {
    const raw = await AsyncStorage.getItem(KEYS.PESANTREN_BRANDING);
    return raw ? JSON.parse(raw) : null;
  },
};
