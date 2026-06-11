-- =============================================================
-- MIGRATION FINAL TABEL GURU
-- Aman dijalankan ulang (semua IF NOT EXISTS / DO $$)
-- Tidak DROP TABLE, tidak hapus data
-- =============================================================

-- 1. Buat tabel guru jika belum ada (fresh install)
CREATE TABLE IF NOT EXISTS guru (
  id   SERIAL PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  jabatan VARCHAR(100)
);

-- 2. Tambah kolom baru (IF NOT EXISTS = aman dijalankan ulang)
ALTER TABLE guru
  ADD COLUMN IF NOT EXISTS nomor_hp      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email         VARCHAR(150),
  ADD COLUMN IF NOT EXISTS alamat        TEXT,
  ADD COLUMN IF NOT EXISTS tanggal_masuk DATE,
  ADD COLUMN IF NOT EXISTS status        VARCHAR(20) DEFAULT 'Aktif',
  ADD COLUMN IF NOT EXISTS catatan       TEXT,
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMP   DEFAULT NOW();

-- 3. Set default untuk kolom status (jika sudah ada tapi default berbeda)
ALTER TABLE guru ALTER COLUMN status SET DEFAULT 'Aktif';

-- 4. Migrasikan data lama: status NULL atau lowercase → Aktif/Nonaktif
UPDATE guru SET status = 'Aktif'    WHERE status IS NULL OR LOWER(status) = 'aktif';
UPDATE guru SET status = 'Nonaktif' WHERE LOWER(status) = 'nonaktif';

-- 5. Hapus constraint lama jika ada (agar tidak konflik)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guru_status_check') THEN
    ALTER TABLE guru DROP CONSTRAINT guru_status_check;
  END IF;
END $$;

-- 6. Tambah constraint baru dengan nilai kapital
ALTER TABLE guru
  ADD CONSTRAINT guru_status_check
  CHECK (status IN ('Aktif', 'Nonaktif'));

-- 7. Buat tabel absensi_guru jika belum ada
CREATE TABLE IF NOT EXISTS absensi_guru (
  id           SERIAL PRIMARY KEY,
  guru_id      INTEGER NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
  bulan        INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun        INTEGER NOT NULL,
  total_hadir  INTEGER DEFAULT 0,
  total_izin   INTEGER DEFAULT 0,
  total_sakit  INTEGER DEFAULT 0,
  total_alfa   INTEGER DEFAULT 0,
  UNIQUE (guru_id, bulan, tahun)
);
