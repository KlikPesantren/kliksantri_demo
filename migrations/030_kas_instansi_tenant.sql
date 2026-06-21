-- ============================================================
-- KlikSantri — Step 2B.1: Kas Instansi Tenant Scope
-- Run: node scripts/run-migration-030.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

-- ============ 1. tenant_id columns ============
ALTER TABLE unit_pendidikan
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE kas_instansi_transaksi
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- ============ 2. Backfill default tenant ============
UPDATE unit_pendidikan u
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND u.tenant_id IS NULL;

UPDATE kas_instansi_transaksi kit
SET tenant_id = u.tenant_id
FROM unit_pendidikan u
WHERE kit.unit_id = u.id
  AND kit.tenant_id IS NULL;

UPDATE kas_instansi_transaksi kit
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND kit.tenant_id IS NULL;

-- ============ 3. Bersihkan scope lintas tenant ============
DELETE FROM user_unit_scope s
USING users usr, unit_pendidikan u
WHERE s.user_id = usr.id
  AND s.unit_id = u.id
  AND usr.tenant_id IS NOT NULL
  AND u.tenant_id IS NOT NULL
  AND usr.tenant_id <> u.tenant_id;

-- ============ 4. NOT NULL ============
ALTER TABLE unit_pendidikan ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE kas_instansi_transaksi ALTER COLUMN tenant_id SET NOT NULL;

-- ============ 5. Unique kode per tenant ============
ALTER TABLE unit_pendidikan DROP CONSTRAINT IF EXISTS unit_pendidikan_kode_key;

DROP INDEX IF EXISTS unit_pendidikan_kode_key;

ALTER TABLE unit_pendidikan
  DROP CONSTRAINT IF EXISTS unit_pendidikan_tenant_kode_key;

ALTER TABLE unit_pendidikan
  ADD CONSTRAINT unit_pendidikan_tenant_kode_key UNIQUE (tenant_id, kode);

-- ============ 6. Indexes ============
CREATE INDEX IF NOT EXISTS idx_unit_pendidikan_tenant_id
  ON unit_pendidikan (tenant_id);

CREATE INDEX IF NOT EXISTS idx_kas_instansi_transaksi_tenant_id
  ON kas_instansi_transaksi (tenant_id);

CREATE INDEX IF NOT EXISTS idx_kas_instansi_transaksi_tenant_unit_tanggal
  ON kas_instansi_transaksi (tenant_id, unit_id, tanggal DESC);

COMMIT;
