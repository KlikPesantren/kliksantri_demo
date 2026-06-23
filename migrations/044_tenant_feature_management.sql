-- ============================================================
-- KlikSantri MT-7 — Tenant Feature Management Foundation
-- Run: node scripts/run-migration-044.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

-- ============ 1. Feature catalog ============
CREATE TABLE IF NOT EXISTS feature_catalog (
  key         VARCHAR(50) PRIMARY KEY,
  label       VARCHAR(100) NOT NULL,
  description TEXT,
  is_core     BOOLEAN NOT NULL DEFAULT false,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============ 2. Tenant features ============
CREATE TABLE IF NOT EXISTS tenant_features (
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key  VARCHAR(50) NOT NULL REFERENCES feature_catalog(key) ON DELETE CASCADE,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id
  ON tenant_features (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_features_enabled
  ON tenant_features (tenant_id, feature_key)
  WHERE enabled = true;

-- ============ 3. Seed catalog ============
INSERT INTO feature_catalog (key, label, description, is_core, sort_order) VALUES
  ('dashboard',    'Dashboard',           'Panel ringkasan operasional',              true,  1),
  ('profil',       'Profil Pesantren',    'Profil dan branding pesantren',            true,  2),
  ('sistem',       'Sistem',              'Manajemen user dan role',                  true,  3),
  ('santri',       'Santri',              'Data dan administrasi santri',             false, 10),
  ('guru',         'Guru',                'Data guru',                                false, 11),
  ('kelas',        'Kelas',               'Data kelas',                               false, 12),
  ('wali',         'Wali Santri',         'Data wali santri (admin)',                 false, 13),
  ('pendidikan',   'Pendidikan',          'Nilai, hafalan, absensi',                  false, 14),
  ('pengumuman',   'Pengumuman',          'Pengumuman pesantren',                     false, 15),
  ('perizinan',    'Perizinan',           'Perizinan keluar santri',                  false, 20),
  ('pelanggaran',  'Pelanggaran',         'Pelanggaran santri',                       false, 21),
  ('keamanan',     'Keamanan',            'Kesehatan dan tamu',                       false, 22),
  ('pembayaran',   'Pembayaran',          'Tagihan dan pembayaran',                   false, 30),
  ('buku_kas',     'Buku Kas',            'Buku kas pondok',                          false, 31),
  ('sahriyah',     'Sahriyah',            'Tagihan dan pembayaran sahriyah',          false, 32),
  ('rfid',         'RFID',                'Kantin digital dan perangkat RFID',        false, 40),
  ('wali_app',     'Aplikasi Wali',       'Portal wali santri (mobile)',              false, 41),
  ('kas_instansi', 'Kas Instansi',        'Kas per unit pendidikan',                  false, 42),
  ('program_unit', 'Program Unit',        'Program dan evaluasi unit',                false, 50),
  ('audit',        'Audit',               'Log audit sistem',                         false, 51)
ON CONFLICT (key) DO UPDATE SET
  label       = EXCLUDED.label,
  description = EXCLUDED.description,
  is_core     = EXCLUDED.is_core,
  sort_order  = EXCLUDED.sort_order;

-- ============ 4. Backfill — all existing tenants get all features enabled ============
INSERT INTO tenant_features (tenant_id, feature_key, enabled, updated_at)
SELECT t.id, fc.key, true, NOW()
FROM tenants t
CROSS JOIN feature_catalog fc
ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
  enabled = CASE
    WHEN EXCLUDED.feature_key IN (
      SELECT key FROM feature_catalog WHERE is_core = true
    ) THEN true
    ELSE tenant_features.enabled
  END,
  updated_at = NOW();

COMMIT;
