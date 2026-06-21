-- ============================================================
-- KlikSantri — Step 3.2: Tenant Onboarding schema
-- Run: node scripts/run-migration-036.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

-- ============ 1. tenants onboarding columns ============
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

UPDATE tenants
SET onboarded_at = COALESCE(onboarded_at, created_at, NOW())
WHERE onboarded_at IS NULL;

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE tenants
  ADD CONSTRAINT tenants_status_check
  CHECK (status IN ('active', 'suspended', 'inactive'));

-- Normalize invalid status on legacy rows (should not happen)
UPDATE tenants
SET status = 'active'
WHERE status IS NULL OR status NOT IN ('active', 'suspended', 'inactive');

-- ============ 2. profil_pesantren one row per tenant ============
ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- Backfill orphan profil rows to default tenant
UPDATE profil_pesantren pp
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND pp.tenant_id IS NULL;

ALTER TABLE profil_pesantren
  DROP CONSTRAINT IF EXISTS profil_pesantren_tenant_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS profil_pesantren_tenant_id_key
  ON profil_pesantren (tenant_id)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_onboarded_at
  ON tenants (onboarded_at DESC);

COMMIT;
