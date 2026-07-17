-- Allow manual alumni records to keep their last class.
BEGIN;

ALTER TABLE alumni
  ADD COLUMN IF NOT EXISTS kelas_terakhir VARCHAR(150);

COMMIT;
