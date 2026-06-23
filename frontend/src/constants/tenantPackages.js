export const TENANT_PACKAGES = [
  {
    id: "basic",
    label: "Basic",
    description:
      "Operasional dasar: santri, guru, kelas, wali, pembayaran, buku kas, pengumuman",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Basic + perizinan, pelanggaran, sahriyah",
  },
  {
    id: "premium",
    label: "Premium",
    description: "Standard + RFID, wali app, kas instansi, audit, program unit",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Pilih fitur secara manual (core selalu aktif)",
  },
];

export const CUSTOM_FEATURE_OPTIONS = [
  { key: "santri", label: "Santri" },
  { key: "guru", label: "Guru" },
  { key: "kelas", label: "Kelas" },
  { key: "wali", label: "Wali Santri" },
  { key: "pendidikan", label: "Pendidikan" },
  { key: "pengumuman", label: "Pengumuman" },
  { key: "perizinan", label: "Perizinan" },
  { key: "pelanggaran", label: "Pelanggaran" },
  { key: "keamanan", label: "Keamanan" },
  { key: "pembayaran", label: "Pembayaran" },
  { key: "buku_kas", label: "Buku Kas" },
  { key: "sahriyah", label: "Sahriyah" },
  { key: "rfid", label: "RFID" },
  { key: "wali_app", label: "Aplikasi Wali" },
  { key: "kas_instansi", label: "Kas Instansi" },
  { key: "program_unit", label: "Program Unit" },
  { key: "audit", label: "Audit" },
];

export function generateClientPassword() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
