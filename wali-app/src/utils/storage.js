import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'wali_token',
  WALI: 'wali_data',
  ANAK: 'wali_anak',
  SANTRI_IDS: 'wali_santri_ids',
  ACTIVE_SANTRI: 'active_santri_id',
  PESANTREN_BRANDING: 'pesantren_branding',
};

export const storage = {
  async saveSession(token, wali, anak, santriIds) {
    await AsyncStorage.multiSet([
      [KEYS.TOKEN, token],
      [KEYS.WALI, JSON.stringify(wali)],
      [KEYS.ANAK, JSON.stringify(anak)],
      [KEYS.SANTRI_IDS, JSON.stringify(santriIds)],
    ]);
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

  async clearSession() {
    await AsyncStorage.multiRemove([
      KEYS.TOKEN,
      KEYS.WALI,
      KEYS.ANAK,
      KEYS.SANTRI_IDS,
      KEYS.ACTIVE_SANTRI,
    ]);
  },

  async savePesantrenBranding({ nama_pesantren, logo_url, alamat, banner_url, banner_active }) {
    await AsyncStorage.setItem(
      KEYS.PESANTREN_BRANDING,
      JSON.stringify({
        nama_pesantren,
        logo_url,
        alamat: alamat ?? null,
        banner_url: banner_url ?? null,
        banner_active: banner_active !== false,
      })
    );
  },

  async getPesantrenBranding() {
    const raw = await AsyncStorage.getItem(KEYS.PESANTREN_BRANDING);
    return raw ? JSON.parse(raw) : null;
  },
};
