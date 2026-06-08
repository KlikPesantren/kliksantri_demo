export const ENDPOINTS = {
  LOGIN: '/wali-app/login',
  ME: '/wali-app/me',
  ANAK: '/wali-app/anak',
  DASHBOARD: '/wali-app/dashboard',
  SANTRI_PROFIL: '/wali-app/santri/profil',
  SAHRIYAH: '/wali-app/sahriyah',
  SAHRIYAH_RIWAYAT: (id) => `/wali-app/sahriyah/${id}/riwayat`,
  RFID_SALDO: '/wali-app/rfid/saldo',
  RFID_MUTASI: '/wali-app/rfid/mutasi',
  ABSENSI: '/wali-app/absensi',
  PERIZINAN: '/wali-app/perizinan',
};
