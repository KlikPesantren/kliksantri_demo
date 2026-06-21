-- ============================================================
-- KlikSantri — Step 2C: Pengumuman tenant scope (wali app feed)
-- Run: node scripts/run-migration-032.js
-- ============================================================

BEGIN;

ALTER TABLE pengumuman
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

UPDATE pengumuman p
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND p.tenant_id IS NULL;

ALTER TABLE pengumuman ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pengumuman_tenant_active
  ON pengumuman (tenant_id, is_active, published_at DESC);

COMMIT;
