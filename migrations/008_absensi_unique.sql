-- ============================================================
-- MIGRATION 008 — UNIQUE constraint + deduplikasi tabel absensi
--
-- Root cause "Simpan gagal":
--   POST /absensi tidak ada ON CONFLICT → re-save = duplicate INSERT
--   Setelah migration, INSERT ... ON CONFLICT DO UPDATE SET status berfungsi
--
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/008_absensi_unique.sql
-- ============================================================

BEGIN;

-- ── STEP 1: Hapus duplikat, pertahankan baris terbaru ────────────────────────
-- Jika ada duplikat (santri_id, tanggal, sesi), hapus yang id-nya lebih kecil

DELETE FROM absensi a
USING absensi b
WHERE
  a.id < b.id
  AND a.santri_id = b.santri_id
  AND a.tanggal   = b.tanggal
  AND a.sesi      = b.sesi;

-- ── STEP 2: Tambahkan UNIQUE constraint ─────────────────────────────────────

ALTER TABLE absensi
ADD CONSTRAINT absensi_santri_tanggal_sesi_key
UNIQUE (santri_id, tanggal, sesi);

-- ── Verifikasi ───────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM absensi;
-- SELECT COUNT(*) FROM (
--   SELECT santri_id, tanggal, sesi, COUNT(*) FROM absensi
--   GROUP BY santri_id, tanggal, sesi HAVING COUNT(*) > 1
-- ) AS duplikat;
-- Expected: 0

COMMIT;
