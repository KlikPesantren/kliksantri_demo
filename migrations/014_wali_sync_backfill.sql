-- =============================================================
-- BACKFILL: Sinkronisasi wali_santri → wali_akun
-- Setiap wali yang belum punya akun login akan dibuatkan akun
-- PIN default: 456789 | must_change_pin: true
-- =============================================================

-- pgcrypto dibutuhkan untuk hash bcrypt di SQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Backfill: insert semua wali_santri yang belum ada di wali_akun
-- ON CONFLICT DO NOTHING: wali yang sudah punya akun tidak disentuh (PIN tidak ditimpa)
INSERT INTO wali_akun (
  nomor_hp,
  nama,
  pin_hash,
  status,
  must_change_pin
)
SELECT
  ws.nomor_hp,
  ws.nama,
  crypt('456789', gen_salt('bf', 10)),
  'active',
  true
FROM wali_santri ws
WHERE ws.nomor_hp IS NOT NULL
  AND TRIM(ws.nomor_hp) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM wali_akun wa
    WHERE wa.nomor_hp = ws.nomor_hp
  );

-- Laporan hasil
SELECT
  (SELECT COUNT(*) FROM wali_santri WHERE nomor_hp IS NOT NULL AND TRIM(nomor_hp) <> '')
    AS total_wali_santri,
  (SELECT COUNT(*) FROM wali_akun)
    AS total_wali_akun,
  (
    SELECT COUNT(*) FROM wali_santri ws
    WHERE ws.nomor_hp IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM wali_akun wa WHERE wa.nomor_hp = ws.nomor_hp)
  ) AS wali_tanpa_akun;
