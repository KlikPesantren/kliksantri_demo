-- =============================================================
-- Kas Instansi: expand unit_pendidikan to 7 units
-- Additive / safe — preserves ids and FK relations (MADIN -> MADINAH)
-- Idempotent — safe to re-run
-- =============================================================

BEGIN;

-- ---------- 1. MADIN -> MADINAH (keep same id, FKs stay valid) ----------
UPDATE unit_pendidikan
SET
  kode = 'MADINAH',
  nama = 'MADINAH',
  sort_order = 7,
  is_active = true
WHERE kode = 'MADIN'
  AND NOT EXISTS (
    SELECT 1 FROM unit_pendidikan WHERE kode = 'MADINAH'
  );

-- If MADINAH already exists from partial run, sync metadata
UPDATE unit_pendidikan
SET
  nama = 'MADINAH',
  sort_order = 7,
  is_active = true
WHERE kode = 'MADINAH';

-- ---------- 2. Existing units: PAUD, SMP, SMA ----------
UPDATE unit_pendidikan
SET
  nama = 'PAUD',
  sort_order = 1,
  is_active = true
WHERE kode = 'PAUD';

UPDATE unit_pendidikan
SET
  sort_order = 5,
  is_active = true
WHERE kode = 'SMP';

UPDATE unit_pendidikan
SET
  sort_order = 6,
  is_active = true
WHERE kode = 'SMA';

-- ---------- 3. New units: TK, SD, MI ----------
INSERT INTO unit_pendidikan (kode, nama, sort_order, is_active) VALUES
  ('TK',  'TK',  2, true),
  ('SD',  'SD',  3, true),
  ('MI',  'MI',  4, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ---------- 4. Ensure MADINAH row exists (fresh DB without MADIN legacy) ----------
INSERT INTO unit_pendidikan (kode, nama, sort_order, is_active) VALUES
  ('MADINAH', 'MADINAH', 7, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

COMMIT;

-- ---------- 5. Orphan check (informational — raises if broken) ----------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM kas_instansi_transaksi t
    LEFT JOIN unit_pendidikan u ON u.id = t.unit_id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Orphan kas_instansi_transaksi.unit_id detected after migration 024';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM user_unit_scope s
    LEFT JOIN unit_pendidikan u ON u.id = s.unit_id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Orphan user_unit_scope.unit_id detected after migration 024';
  END IF;
END $$;
