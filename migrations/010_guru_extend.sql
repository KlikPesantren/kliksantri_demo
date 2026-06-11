-- Tambah kolom-kolom operasional ke tabel guru
-- Gunakan IF NOT EXISTS agar aman dijalankan ulang

ALTER TABLE guru
  ADD COLUMN IF NOT EXISTS nomor_hp     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS alamat       TEXT,
  ADD COLUMN IF NOT EXISTS tanggal_masuk DATE,
  ADD COLUMN IF NOT EXISTS status       VARCHAR(20) DEFAULT 'aktif',
  ADD COLUMN IF NOT EXISTS created_at   TIMESTAMP   DEFAULT NOW();

-- Tambah constraint status setelah kolom ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'guru_status_check'
  ) THEN
    ALTER TABLE guru
      ADD CONSTRAINT guru_status_check
      CHECK (status IN ('aktif', 'nonaktif'));
  END IF;
END $$;
