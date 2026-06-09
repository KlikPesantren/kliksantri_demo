-- ============================================================
-- MIGRATION 006 — Normalisasi semua nomor_hp ke format 08xxx
-- Sebelumnya: 628xxx (format internasional tanpa +)
-- Sesudahnya:  08xxx (format lokal Indonesia)
--
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/006_normalize_phone_08.sql
-- ============================================================

BEGIN;

-- ── Step 1: Konversi wali_akun.nomor_hp ──────────────────────────────────────
-- 628xxx → 08xxx

UPDATE wali_akun
SET
  nomor_hp = '0' || SUBSTRING(nomor_hp FROM 3),
  updated_at = NOW()
WHERE nomor_hp LIKE '62%';

-- Verifikasi: tidak boleh ada 628xxx tersisa
-- SELECT nomor_hp FROM wali_akun WHERE nomor_hp LIKE '62%';
-- Expected: 0 rows

-- ── Step 2: Konversi wali_santri.nomor_hp ────────────────────────────────────

UPDATE wali_santri
SET nomor_hp = '0' || SUBSTRING(nomor_hp FROM 3)
WHERE nomor_hp LIKE '62%';

-- ── Step 3: Verifikasi konsistensi ───────────────────────────────────────────
-- Jalankan setelah migration untuk memastikan tidak ada data yatim:

-- SELECT
--   wa.nomor_hp               AS akun_hp,
--   wa.nama                   AS nama_akun,
--   wa.status,
--   COUNT(ws.id)              AS jumlah_santri
-- FROM wali_akun wa
-- LEFT JOIN wali_santri ws ON ws.nomor_hp = wa.nomor_hp
-- GROUP BY wa.id, wa.nomor_hp, wa.nama, wa.status
-- ORDER BY wa.id;

COMMIT;
