-- =============================================================
-- MIGRATION: Refactor absensi_guru — nama_guru → guru_id (FK)
-- Aman dijalankan ulang (semua operasi dicek kondisinya)
-- =============================================================

-- LANGKAH 1: Tambah kolom guru_id jika belum ada
ALTER TABLE absensi_guru
  ADD COLUMN IF NOT EXISTS guru_id INTEGER;

-- LANGKAH 2: Mapping data lama — nama_guru → guru.id (case-insensitive trim)
-- Hanya update baris yang guru_id-nya masih NULL dan nama_guru ada
UPDATE absensi_guru ag
SET    guru_id = g.id
FROM   guru g
WHERE  ag.guru_id IS NULL
  AND  ag.nama_guru IS NOT NULL
  AND  LOWER(TRIM(g.nama)) = LOWER(TRIM(ag.nama_guru));

-- LANGKAH 3: Hapus baris yang guru_id masih NULL setelah mapping
-- (nama_guru tidak cocok dengan data di tabel guru → data yatim, tidak bisa diberi FK)
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM absensi_guru WHERE guru_id IS NULL;
  IF cnt > 0 THEN
    RAISE NOTICE 'Menghapus % baris absensi_guru yang tidak cocok dengan guru manapun', cnt;
    DELETE FROM absensi_guru WHERE guru_id IS NULL;
  END IF;
END $$;

-- LANGKAH 4: Set NOT NULL setelah semua baris terpetakan
ALTER TABLE absensi_guru ALTER COLUMN guru_id SET NOT NULL;

-- LANGKAH 5: Tambah Foreign Key jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_absensi_guru_guru_id'
  ) THEN
    ALTER TABLE absensi_guru
      ADD CONSTRAINT fk_absensi_guru_guru_id
      FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE;
  END IF;
END $$;

-- LANGKAH 6: Tambah UNIQUE constraint (guru_id, bulan, tahun) jika belum ada
-- Diperlukan agar ON CONFLICT di INSERT bisa berjalan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'absensi_guru_guru_id_bulan_tahun_key'
  ) THEN
    ALTER TABLE absensi_guru
      ADD CONSTRAINT absensi_guru_guru_id_bulan_tahun_key
      UNIQUE (guru_id, bulan, tahun);
  END IF;
END $$;

-- LANGKAH 7: Hapus kolom nama_guru setelah data terpetakan
ALTER TABLE absensi_guru DROP COLUMN IF EXISTS nama_guru;

-- LANGKAH 8: Verifikasi hasil akhir
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'absensi_guru'
ORDER BY ordinal_position;
