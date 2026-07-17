-- Core unit ownership: classes and teachers belong to a tenant unit.
-- Existing records are assigned to the Pesantren unit for backward compatibility.
BEGIN;

INSERT INTO unit_pendidikan (tenant_id, kode, nama, sort_order, is_active)
SELECT t.id, 'PESANTREN', 'Pesantren', 0, true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM unit_pendidikan u
  WHERE u.tenant_id = t.id AND UPPER(u.kode) = 'PESANTREN'
);

ALTER TABLE kelas ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES unit_pendidikan(id);
ALTER TABLE guru ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES unit_pendidikan(id);

UPDATE kelas k
SET unit_id = u.id
FROM unit_pendidikan u
WHERE k.tenant_id = u.tenant_id
  AND UPPER(u.kode) = 'PESANTREN'
  AND k.unit_id IS NULL;

UPDATE guru g
SET unit_id = u.id
FROM unit_pendidikan u
WHERE g.tenant_id = u.tenant_id
  AND UPPER(u.kode) = 'PESANTREN'
  AND g.unit_id IS NULL;

ALTER TABLE kelas ALTER COLUMN unit_id SET NOT NULL;
ALTER TABLE guru ALTER COLUMN unit_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kelas_tenant_unit ON kelas (tenant_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_guru_tenant_unit ON guru (tenant_id, unit_id);

COMMIT;
