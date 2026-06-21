// =============================================================
// SUMBER KEBENARAN TUNGGAL UNTUK RBAC FRONTEND
// Dipakai bersama oleh Sidebar.jsx dan ProtectedRoute.jsx
// =============================================================

// Map: path frontend → permission yang dibutuhkan untuk membukanya
export const ROUTE_PERMISSIONS = {
  "/dashboard":         "dashboard.view",
  "/santri":            "santri.view",
  "/kelas":             "kelas.view",
  "/wali":              "wali.view",
  "/guru":              "guru.view",
  "/absensi":           "absensi.view",
  "/absensi-guru":      "absensi_guru.view",
  "/hafalan":           "hafalan.view",
  "/nilai":             "nilai.view",
  "/pembayaran":        "pembayaran.view",
  "/buku-kas":          "bukukas.view",
  "/kas-instansi":      "kas_instansi.view",
  "/kas-instansi/konsolidasi": "kas_instansi.konsolidasi",
  "/program-unit":      "program_unit.view",
  "/sahriyah":          "sahriyah.view",
  "/sahriyah-setting":  "sahriyah.manage",
  "/pelanggaran":       "pelanggaran.view",
  "/kesehatan":         "kesehatan.view",
  "/perizinan":         "perizinan.view",
  "/tamu":              "tamu.view",
  "/pengumuman":        "pengumuman.view",
  "/profil-pesantren":  "profil.view",
  "/devices":           "device.view",
  "/audit":             "audit.view",
  "/rfid-monitor":      "rfid.view",
  "/rfid-dashboard":    "rfid.view",
  "/rfid-transactions": "rfid.view",
  "/rfid-topup":        "rfid.view",
  "/rfid-merchant":     "rfid.view",
  "/rfid-devices":      "rfid.view",
  "/rfid-mutasi":       "rfid.view",
  "/rfid-refund":       "rfid.view",
  "/users":             "user.view",
  "/roles":             "role.manage",
};
