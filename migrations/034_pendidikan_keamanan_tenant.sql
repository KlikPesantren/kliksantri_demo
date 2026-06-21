-- ============================================================
-- KlikSantri — Multi-Tenant Step 2E: Pendidikan & Keamanan
-- Run: node scripts/run-migration-034.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

-- ============ 1. tenant_id columns ============
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE absensi_santri ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE absensi_guru ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE hafalan ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE nilai_mingguan ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE pelanggaran ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE perizinan ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE kesehatan_santri ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE tamu ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- ============ 2. Backfill via parent ============
UPDATE absensi a
SET tenant_id = s.tenant_id
FROM santri s
WHERE a.santri_id = s.id
  AND a.tenant_id IS NULL;

UPDATE absensi_santri a
SET tenant_id = s.tenant_id
FROM santri s
WHERE a.santri_id = s.id
  AND a.tenant_id IS NULL;

UPDATE absensi_guru ag
SET tenant_id = g.tenant_id
FROM guru g
WHERE ag.guru_id = g.id
  AND ag.tenant_id IS NULL;

UPDATE hafalan h
SET tenant_id = s.tenant_id
FROM santri s
WHERE h.santri_id = s.id
  AND h.tenant_id IS NULL;

UPDATE nilai_mingguan n
SET tenant_id = s.tenant_id
FROM santri s
WHERE n.santri_id = s.id
  AND n.tenant_id IS NULL;

UPDATE pelanggaran p
SET tenant_id = s.tenant_id
FROM santri s
WHERE p.santri_id = s.id
  AND p.tenant_id IS NULL;

UPDATE perizinan p
SET tenant_id = s.tenant_id
FROM santri s
WHERE p.santri_id = s.id
  AND p.tenant_id IS NULL;

UPDATE kesehatan_santri k
SET tenant_id = s.tenant_id
FROM santri s
WHERE k.santri_id = s.id
  AND k.tenant_id IS NULL;

-- tamu: no parent FK
UPDATE tamu t
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND t.tenant_id IS NULL;

-- ============ 3. Fallback orphan rows → default tenant ============
UPDATE absensi a
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND a.tenant_id IS NULL;

UPDATE absensi_santri a
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND a.tenant_id IS NULL;

UPDATE absensi_guru ag
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND ag.tenant_id IS NULL;

UPDATE hafalan h
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND h.tenant_id IS NULL;

UPDATE nilai_mingguan n
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND n.tenant_id IS NULL;

UPDATE pelanggaran p
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND p.tenant_id IS NULL;

UPDATE perizinan p
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND p.tenant_id IS NULL;

UPDATE kesehatan_santri k
SET tenant_id = tn.id
FROM tenants tn
WHERE tn.slug = 'default'
  AND k.tenant_id IS NULL;

-- ============ 4. NOT NULL ============
ALTER TABLE absensi ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE absensi_santri ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE absensi_guru ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE hafalan ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE nilai_mingguan ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pelanggaran ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE perizinan ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE kesehatan_santri ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tamu ALTER COLUMN tenant_id SET NOT NULL;

-- ============ 5. Indexes ============
CREATE INDEX IF NOT EXISTS idx_absensi_tenant_id ON absensi (tenant_id);
CREATE INDEX IF NOT EXISTS idx_absensi_tenant_tanggal ON absensi (tenant_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_santri_tenant_id ON absensi_santri (tenant_id);
CREATE INDEX IF NOT EXISTS idx_absensi_guru_tenant_id ON absensi_guru (tenant_id);
CREATE INDEX IF NOT EXISTS idx_hafalan_tenant_id ON hafalan (tenant_id);
CREATE INDEX IF NOT EXISTS idx_hafalan_tenant_bulan ON hafalan (tenant_id, bulan, tahun);
CREATE INDEX IF NOT EXISTS idx_nilai_mingguan_tenant_id ON nilai_mingguan (tenant_id);
CREATE INDEX IF NOT EXISTS idx_nilai_mingguan_tenant_bulan ON nilai_mingguan (tenant_id, bulan, tahun);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_tenant_id ON pelanggaran (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_tenant_tanggal ON pelanggaran (tenant_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_perizinan_tenant_id ON perizinan (tenant_id);
CREATE INDEX IF NOT EXISTS idx_perizinan_tenant_status ON perizinan (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_kesehatan_santri_tenant_id ON kesehatan_santri (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tamu_tenant_id ON tamu (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tamu_tenant_tanggal ON tamu (tenant_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_tamu_tenant_status ON tamu (tenant_id, status);

-- ============ 6. Optional composite uniques (upsert safety) ============
CREATE UNIQUE INDEX IF NOT EXISTS hafalan_tenant_santri_bulan_tahun_pekan_key
  ON hafalan (tenant_id, santri_id, bulan, tahun, pekan)
  WHERE pekan IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS nilai_mingguan_tenant_santri_mapel_bulan_tahun_key
  ON nilai_mingguan (tenant_id, santri_id, mapel, bulan, tahun);

COMMIT;
