-- ============================================================
-- MIGRATION 007 — Sinkronisasi wali_santri → wali_akun
--
-- Tujuan:
--   1. Konversi semua nomor_hp 628xxx → 08xxx di kedua tabel
--   2. Buat wali_akun untuk semua wali_santri yang belum punya akun
--
-- PIN default: 456789
-- Hash di bawah digenerate dengan: bcrypt('456789', 10)
-- Jika perlu generate ulang:
--   node -e "require('bcryptjs').hash('456789',10).then(console.log)"
--
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/007_sync_wali_akun.sql
-- ============================================================

BEGIN;

-- ── STEP 1: Normalisasi nomor_hp 628xxx → 08xxx di wali_akun ────────────────

UPDATE wali_akun
SET
  nomor_hp   = '0' || SUBSTRING(nomor_hp FROM 3),
  updated_at = NOW()
WHERE nomor_hp LIKE '62%';

-- ── STEP 2: Normalisasi nomor_hp 628xxx → 08xxx di wali_santri ──────────────

UPDATE wali_santri
SET nomor_hp = '0' || SUBSTRING(nomor_hp FROM 3)
WHERE nomor_hp LIKE '62%';

-- ── STEP 3: Buat wali_akun untuk semua wali_santri yang belum punya ─────────
-- Hash bcrypt('456789', 10) — ganti jika perlu generate ulang di atas
-- Menggunakan subquery DISTINCT ON nomor_hp agar tidak duplikat
-- ON CONFLICT DO NOTHING: jika akun sudah ada, tidak ditimpa

INSERT INTO wali_akun (
  nomor_hp,
  nama,
  pin_hash,
  status,
  must_change_pin
)
SELECT DISTINCT ON (ws.nomor_hp)
  ws.nomor_hp,
  ws.nama,
  '$2b$10$.b7scYojAGBeAzlsw70/GO75MZcUKDIm5UJJ7XHlHLEL0CJYLKUEe',
  'active',
  true
FROM wali_santri ws
WHERE
  ws.nomor_hp IS NOT NULL
  AND ws.nomor_hp <> ''
ORDER BY ws.nomor_hp, ws.id ASC
ON CONFLICT (nomor_hp) DO NOTHING;

-- ── STEP 4: Verifikasi ───────────────────────────────────────────────────────

-- Cek: tidak ada nomor 628xxx yang tersisa
-- SELECT COUNT(*) AS masih_628 FROM wali_akun  WHERE nomor_hp LIKE '62%';
-- SELECT COUNT(*) AS masih_628 FROM wali_santri WHERE nomor_hp LIKE '62%';
-- Expected: 0, 0

-- Cek: semua wali_santri punya akun
-- SELECT
--   ws.nomor_hp,
--   ws.nama,
--   wa.id AS wali_akun_id,
--   wa.status
-- FROM wali_santri ws
-- LEFT JOIN wali_akun wa ON wa.nomor_hp = ws.nomor_hp
-- WHERE wa.id IS NULL;
-- Expected: 0 rows

COMMIT;
