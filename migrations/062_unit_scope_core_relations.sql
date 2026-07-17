-- Unit ownership for announcements. Other core modules inherit unit through santri -> kelas.
BEGIN;

ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES unit_pendidikan(id);

UPDATE pengumuman p
SET unit_id = u.id
FROM unit_pendidikan u
WHERE p.tenant_id = u.tenant_id
  AND UPPER(u.kode) = 'PESANTREN'
  AND p.unit_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_pengumuman_tenant_unit ON pengumuman (tenant_id, unit_id);

COMMIT;
