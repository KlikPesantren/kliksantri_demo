-- ============================================================
-- HOTFIX DEMO — Pastikan relasi wali_akun <-> wali_santri tersambung
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/003_demo_data_fix.sql
-- ============================================================

-- STEP 1: Lihat kondisi data saat ini
-- (Jalankan SELECT ini dulu, perhatikan hasilnya sebelum UPDATE)

SELECT
  s.id          AS santri_id,
  s.nama        AS nama_santri,
  s.nis,
  ws.id         AS wali_santri_id,
  ws.nama       AS nama_wali,
  ws.nomor_hp   AS nomor_hp_wali
FROM santri s
LEFT JOIN wali_santri ws ON ws.santri_id = s.id
ORDER BY s.id
LIMIT 20;

-- STEP 2: Cek akun wali_akun yang sudah ada
SELECT id, nomor_hp, nama, status FROM wali_akun LIMIT 10;

-- ============================================================
-- FIX A: Update nomor_hp di wali_santri
-- Sesuaikan WHERE dengan kondisi data aktual:
--   - Jika wali_santri sudah ada tapi nomor_hp kosong/null
-- ============================================================

-- Contoh: set nomor_hp untuk wali santri dengan santri_id tertentu
-- GANTI angka di WHERE sesuai hasil STEP 1

UPDATE wali_santri
SET nomor_hp = '628123456789'
WHERE santri_id IN (
  SELECT id FROM santri ORDER BY id LIMIT 3
)
AND (nomor_hp IS NULL OR nomor_hp = '');

-- ============================================================
-- FIX B: Jika wali_santri kosong untuk santri yang ingin di-demo,
-- insert baris baru
-- ============================================================

-- Uncomment dan sesuaikan santri_id dengan data aktual:
/*
INSERT INTO wali_santri (santri_id, nama, nomor_hp, alamat)
SELECT
  s.id,
  'Wali Demo',
  '628123456789',
  'Alamat Demo'
FROM santri s
WHERE s.id IN (1, 2, 3)  -- sesuaikan dengan santri yang ada
  AND NOT EXISTS (
    SELECT 1 FROM wali_santri ws WHERE ws.santri_id = s.id
  );
*/

-- ============================================================
-- STEP 3: Verifikasi setelah fix
-- ============================================================

SELECT
  wa.nomor_hp               AS "Akun Wali",
  wa.nama                   AS "Nama Akun",
  wa.status                 AS "Status",
  COUNT(ws.id)              AS "Jumlah Santri Terdaftar"
FROM wali_akun wa
LEFT JOIN wali_santri ws ON ws.nomor_hp = wa.nomor_hp
GROUP BY wa.id, wa.nomor_hp, wa.nama, wa.status;

-- Hasil yang diharapkan: Jumlah Santri Terdaftar > 0
-- Jika masih 0, jalankan FIX B di atas
