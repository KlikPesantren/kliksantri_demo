-- ============================================================
-- KlikSantri — Step 2D: RFID Tenant Scope
-- Run: node scripts/run-migration-033.js
-- ============================================================

BEGIN;

-- ============ 1. tenant_id columns ============
ALTER TABLE merchant_rfid
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE transaksi_rfid
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE transaksi
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE rfid_sync_queue
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE rfid_limit_settings
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE rfid_limit_override
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE rfid_override_logs
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- ============ 2. Backfill default tenant ============
UPDATE merchant_rfid m
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND m.tenant_id IS NULL;

UPDATE devices d
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND d.tenant_id IS NULL;

UPDATE transaksi_rfid tr
SET tenant_id = s.tenant_id
FROM santri s
WHERE tr.santri_id = s.id
  AND tr.tenant_id IS NULL;

UPDATE transaksi_rfid tr
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND tr.tenant_id IS NULL;

UPDATE transaksi tx
SET tenant_id = s.tenant_id
FROM santri s
WHERE tx.santri_id = s.id
  AND tx.tenant_id IS NULL;

UPDATE transaksi tx
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND tx.tenant_id IS NULL;

UPDATE rfid_sync_queue q
SET tenant_id = d.tenant_id
FROM devices d
WHERE q.device_id = d.id
  AND q.tenant_id IS NULL;

UPDATE rfid_sync_queue q
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND q.tenant_id IS NULL;

UPDATE rfid_limit_settings ls
SET tenant_id = s.tenant_id
FROM santri s
WHERE ls.santri_id = s.id
  AND ls.tenant_id IS NULL;

UPDATE rfid_limit_override lo
SET tenant_id = s.tenant_id
FROM santri s
WHERE lo.santri_id = s.id
  AND lo.tenant_id IS NULL;

UPDATE rfid_override_logs ol
SET tenant_id = s.tenant_id
FROM santri s
WHERE ol.santri_id = s.id
  AND ol.tenant_id IS NULL;

-- ============ 3. Bersihkan merchant lintas tenant pada device ============
UPDATE devices d
SET merchant_id = NULL
FROM merchant_rfid m
WHERE d.merchant_id = m.id
  AND d.tenant_id IS NOT NULL
  AND m.tenant_id IS NOT NULL
  AND d.tenant_id <> m.tenant_id;

-- ============ 4. NOT NULL ============
ALTER TABLE merchant_rfid ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE devices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE transaksi_rfid ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE transaksi ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE rfid_sync_queue ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE rfid_limit_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE rfid_limit_override ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE rfid_override_logs ALTER COLUMN tenant_id SET NOT NULL;

-- ============ 5. Drop old uniques ============
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_device_id_key;
ALTER TABLE transaksi_rfid DROP CONSTRAINT IF EXISTS transaksi_rfid_trx_uuid_key;
ALTER TABLE transaksi DROP CONSTRAINT IF EXISTS transaksi_trx_id_key;
ALTER TABLE rfid_sync_queue DROP CONSTRAINT IF EXISTS rfid_sync_queue_trx_uuid_key;
ALTER TABLE rfid_limit_settings DROP CONSTRAINT IF EXISTS rfid_limit_settings_santri_id_key;

-- ============ 6. New composite uniques ============
ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS devices_tenant_device_id_key;
ALTER TABLE devices
  ADD CONSTRAINT devices_tenant_device_id_key UNIQUE (tenant_id, device_id);

ALTER TABLE transaksi_rfid
  DROP CONSTRAINT IF EXISTS transaksi_rfid_tenant_trx_uuid_key;
ALTER TABLE transaksi_rfid
  ADD CONSTRAINT transaksi_rfid_tenant_trx_uuid_key UNIQUE (tenant_id, trx_uuid);

ALTER TABLE transaksi
  DROP CONSTRAINT IF EXISTS transaksi_tenant_trx_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS transaksi_tenant_trx_id_key
  ON transaksi (tenant_id, trx_id)
  WHERE trx_id IS NOT NULL AND TRIM(trx_id) <> '';

ALTER TABLE rfid_sync_queue
  DROP CONSTRAINT IF EXISTS rfid_sync_queue_tenant_trx_uuid_key;
ALTER TABLE rfid_sync_queue
  ADD CONSTRAINT rfid_sync_queue_tenant_trx_uuid_key UNIQUE (tenant_id, trx_uuid);

ALTER TABLE rfid_limit_settings
  DROP CONSTRAINT IF EXISTS rfid_limit_settings_tenant_santri_key;
ALTER TABLE rfid_limit_settings
  ADD CONSTRAINT rfid_limit_settings_tenant_santri_key UNIQUE (tenant_id, santri_id);

-- ============ 7. Indexes ============
CREATE INDEX IF NOT EXISTS idx_merchant_rfid_tenant_id
  ON merchant_rfid (tenant_id);

CREATE INDEX IF NOT EXISTS idx_devices_tenant_id
  ON devices (tenant_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_rfid_tenant_id
  ON transaksi_rfid (tenant_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_rfid_tenant_trx_id
  ON transaksi_rfid (tenant_id, trx_id)
  WHERE trx_id IS NOT NULL AND TRIM(trx_id) <> '';

CREATE INDEX IF NOT EXISTS idx_transaksi_tenant_id
  ON transaksi (tenant_id);

CREATE INDEX IF NOT EXISTS idx_rfid_sync_queue_tenant_id
  ON rfid_sync_queue (tenant_id);

COMMIT;
