-- ============================================================
-- KlikSantri — Step 2B.2: Program Unit Tenant Scope
-- Run: node scripts/run-migration-031.js
-- ============================================================

BEGIN;

ALTER TABLE program_unit
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE program_unit_evaluasi
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

UPDATE program_unit p
SET tenant_id = u.tenant_id
FROM unit_pendidikan u
WHERE p.unit_id = u.id
  AND p.tenant_id IS NULL;

UPDATE program_unit p
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND p.tenant_id IS NULL;

UPDATE program_unit_evaluasi e
SET tenant_id = p.tenant_id
FROM program_unit p
WHERE e.program_id = p.id
  AND e.tenant_id IS NULL;

UPDATE program_unit_evaluasi e
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND e.tenant_id IS NULL;

ALTER TABLE program_unit ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE program_unit_evaluasi ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_unit_tenant_id
  ON program_unit (tenant_id);

CREATE INDEX IF NOT EXISTS idx_program_unit_tenant_unit_status
  ON program_unit (tenant_id, unit_id, status);

CREATE INDEX IF NOT EXISTS idx_program_unit_evaluasi_tenant_id
  ON program_unit_evaluasi (tenant_id);

CREATE INDEX IF NOT EXISTS idx_program_unit_evaluasi_tenant_program
  ON program_unit_evaluasi (tenant_id, program_id, tahun DESC, bulan DESC);

COMMIT;
