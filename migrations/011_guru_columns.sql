-- Tambah kolom email dan catatan ke tabel guru

ALTER TABLE guru
  ADD COLUMN IF NOT EXISTS email   VARCHAR(150),
  ADD COLUMN IF NOT EXISTS catatan TEXT;

-- Perbaiki constraint status: ganti lowercase → kapitalisasi (Aktif / Nonaktif)
-- Hapus constraint lama jika ada

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guru_status_check'
  ) THEN
    ALTER TABLE guru DROP CONSTRAINT guru_status_check;
  END IF;
END $$;

-- Migrasi data lama ke nilai kapital
UPDATE guru SET status = 'Aktif'    WHERE LOWER(status) = 'aktif';
UPDATE guru SET status = 'Nonaktif' WHERE LOWER(status) = 'nonaktif';

-- Set default baru
ALTER TABLE guru ALTER COLUMN status SET DEFAULT 'Aktif';

-- Tambah constraint baru dengan nilai kapital
ALTER TABLE guru
  ADD CONSTRAINT guru_status_check
  CHECK (status IN ('Aktif', 'Nonaktif'));
