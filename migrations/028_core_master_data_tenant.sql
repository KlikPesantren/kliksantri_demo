-- ============================================================
-- KlikSantri — Multi-Tenant Step 2A: Core Master Data
-- Run: node scripts/run-migration-028.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

-- ============ 1. tenant_id columns ============
ALTER TABLE kelas ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE guru ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE santri ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE wali_santri ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE wali_akun ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- ============ 2. Backfill default tenant ============
UPDATE kelas k
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND k.tenant_id IS NULL;

UPDATE guru g
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND g.tenant_id IS NULL;

UPDATE santri s
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND s.tenant_id IS NULL;

UPDATE wali_santri ws
SET tenant_id = s.tenant_id
FROM santri s
WHERE ws.santri_id = s.id
  AND ws.tenant_id IS NULL;

UPDATE wali_santri ws
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND ws.tenant_id IS NULL;

UPDATE wali_akun wa
SET tenant_id = sub.tenant_id
FROM (
  SELECT DISTINCT ON (ws.nomor_hp)
    ws.nomor_hp,
    ws.tenant_id
  FROM wali_santri ws
  WHERE ws.nomor_hp IS NOT NULL
    AND TRIM(ws.nomor_hp) <> ''
    AND ws.tenant_id IS NOT NULL
  ORDER BY ws.nomor_hp, ws.id ASC
) sub
WHERE wa.nomor_hp = sub.nomor_hp
  AND wa.tenant_id IS NULL;

UPDATE wali_akun wa
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND wa.tenant_id IS NULL;

-- ============ 3. NOT NULL ============
ALTER TABLE kelas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE guru ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE santri ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE wali_santri ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE wali_akun ALTER COLUMN tenant_id SET NOT NULL;

-- ============ 4. Indexes tenant_id ============
CREATE INDEX IF NOT EXISTS idx_kelas_tenant_id ON kelas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_guru_tenant_id ON guru (tenant_id);
CREATE INDEX IF NOT EXISTS idx_santri_tenant_id ON santri (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wali_santri_tenant_id ON wali_santri (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wali_akun_tenant_id ON wali_akun (tenant_id);

-- ============ 5. Unique per tenant ============
ALTER TABLE santri DROP CONSTRAINT IF EXISTS santri_nis_key;
ALTER TABLE santri DROP CONSTRAINT IF EXISTS santri_uid_rfid_key;
ALTER TABLE wali_akun DROP CONSTRAINT IF EXISTS wali_akun_nomor_hp_key;

CREATE UNIQUE INDEX IF NOT EXISTS santri_tenant_nis_key
  ON santri (tenant_id, nis)
  WHERE nis IS NOT NULL AND TRIM(nis) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS santri_tenant_uid_rfid_key
  ON santri (tenant_id, uid_rfid)
  WHERE uid_rfid IS NOT NULL AND TRIM(uid_rfid) <> '';

ALTER TABLE wali_akun
  DROP CONSTRAINT IF EXISTS wali_akun_tenant_nomor_hp_key;

ALTER TABLE wali_akun
  ADD CONSTRAINT wali_akun_tenant_nomor_hp_key UNIQUE (tenant_id, nomor_hp);

COMMIT;
