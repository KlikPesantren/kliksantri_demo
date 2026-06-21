-- ============================================================
-- KlikSantri — Multi-Tenant Step 2B: Keuangan & Dashboard
-- Run: node scripts/run-migration-029.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

-- ============ 1. tenant_id columns ============
ALTER TABLE jenis_tagihan ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE buku_kas ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE pembayaran ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE pembayaran_detail ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE tagihan_sahriyah ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE pembayaran_sahriyah ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE sahriyah_setting ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- ============ 2. Backfill default / via parent ============
UPDATE jenis_tagihan jt
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND jt.tenant_id IS NULL;

UPDATE buku_kas bk
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND bk.tenant_id IS NULL;

UPDATE pembayaran p
SET tenant_id = s.tenant_id
FROM santri s
WHERE p.santri_id = s.id
  AND p.tenant_id IS NULL;

UPDATE pembayaran p
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND p.tenant_id IS NULL;

UPDATE tagihan_sahriyah ts
SET tenant_id = s.tenant_id
FROM santri s
WHERE ts.santri_id = s.id
  AND ts.tenant_id IS NULL;

UPDATE tagihan_sahriyah ts
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND ts.tenant_id IS NULL;

UPDATE sahriyah_setting ss
SET tenant_id = s.tenant_id
FROM santri s
WHERE ss.santri_id = s.id
  AND ss.tenant_id IS NULL;

UPDATE sahriyah_setting ss
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND ss.tenant_id IS NULL;

UPDATE pembayaran_detail pd
SET tenant_id = p.tenant_id
FROM pembayaran p
WHERE pd.pembayaran_id = p.id
  AND pd.tenant_id IS NULL;

UPDATE pembayaran_detail pd
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND pd.tenant_id IS NULL;

UPDATE pembayaran_sahriyah ps
SET tenant_id = ts.tenant_id
FROM tagihan_sahriyah ts
WHERE ps.tagihan_id = ts.id
  AND ps.tenant_id IS NULL;

UPDATE pembayaran_sahriyah ps
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND ps.tenant_id IS NULL;

-- ============ 3. NOT NULL ============
ALTER TABLE jenis_tagihan ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE buku_kas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pembayaran ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pembayaran_detail ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tagihan_sahriyah ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pembayaran_sahriyah ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sahriyah_setting ALTER COLUMN tenant_id SET NOT NULL;

-- ============ 4. Indexes ============
CREATE INDEX IF NOT EXISTS idx_jenis_tagihan_tenant_id ON jenis_tagihan (tenant_id);
CREATE INDEX IF NOT EXISTS idx_buku_kas_tenant_id ON buku_kas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_buku_kas_tenant_tanggal ON buku_kas (tenant_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tenant_id ON pembayaran (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_detail_tenant_id ON pembayaran_detail (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_sahriyah_tenant_id ON tagihan_sahriyah (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_sahriyah_tenant_id ON pembayaran_sahriyah (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sahriyah_setting_tenant_id ON sahriyah_setting (tenant_id);

-- ============ 5. Unique per tenant ============
ALTER TABLE sahriyah_setting DROP CONSTRAINT IF EXISTS sahriyah_setting_santri_id_key;

ALTER TABLE sahriyah_setting
  DROP CONSTRAINT IF EXISTS sahriyah_setting_tenant_santri_key;

ALTER TABLE sahriyah_setting
  ADD CONSTRAINT sahriyah_setting_tenant_santri_key UNIQUE (tenant_id, santri_id);

DROP INDEX IF EXISTS tagihan_sahriyah_tenant_santri_bulan_tahun_key;

CREATE UNIQUE INDEX tagihan_sahriyah_tenant_santri_bulan_tahun_key
  ON tagihan_sahriyah (tenant_id, santri_id, bulan, tahun);

COMMIT;
