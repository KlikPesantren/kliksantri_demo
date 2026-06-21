-- ============================================================
-- KlikSantri — Multi-Tenant Step 1: Tenant Foundation
-- Run: node scripts/run-migration-027.js
-- Idempotent — aman dijalankan ulang.
-- ============================================================

BEGIN;

-- ============ 1. TABEL tenants ============
CREATE TABLE IF NOT EXISTS tenants (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(80) UNIQUE NOT NULL,
  nama            VARCHAR(200) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  alamat          TEXT,
  telepon         VARCHAR(30),
  email           VARCHAR(100),
  website         VARCHAR(200),
  logo_url        VARCHAR(500),
  banner_url      VARCHAR(500),
  banner_active   BOOLEAN NOT NULL DEFAULT TRUE,
  splash_logo_url VARCHAR(500),
  app_icon_url    VARCHAR(500),
  tagline         VARCHAR(200),
  tentang         TEXT,
  visi            TEXT,
  misi            TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants (slug);

-- ============ 2. BACKFILL dari profil_pesantren ============
INSERT INTO tenants (
  slug,
  nama,
  alamat,
  telepon,
  email,
  website,
  logo_url,
  banner_url,
  banner_active,
  splash_logo_url,
  app_icon_url,
  tagline,
  tentang,
  visi,
  misi,
  updated_at
)
SELECT
  'default',
  pp.nama_pesantren,
  pp.alamat,
  pp.telepon,
  pp.email,
  pp.website,
  pp.logo_url,
  pp.banner_url,
  COALESCE(pp.banner_active, TRUE),
  pp.splash_logo_url,
  pp.app_icon_url,
  pp.tagline,
  pp.tentang,
  pp.visi,
  pp.misi,
  COALESCE(pp.updated_at, NOW())
FROM profil_pesantren pp
ORDER BY pp.id ASC
LIMIT 1
ON CONFLICT (slug) DO UPDATE SET
  nama            = EXCLUDED.nama,
  alamat          = EXCLUDED.alamat,
  telepon         = EXCLUDED.telepon,
  email           = EXCLUDED.email,
  website         = EXCLUDED.website,
  logo_url        = EXCLUDED.logo_url,
  banner_url      = EXCLUDED.banner_url,
  banner_active   = EXCLUDED.banner_active,
  splash_logo_url = EXCLUDED.splash_logo_url,
  app_icon_url    = EXCLUDED.app_icon_url,
  tagline         = EXCLUDED.tagline,
  tentang         = EXCLUDED.tentang,
  visi            = EXCLUDED.visi,
  misi            = EXCLUDED.misi,
  updated_at      = EXCLUDED.updated_at;

-- Fallback jika profil_pesantren kosong
INSERT INTO tenants (slug, nama, status)
SELECT 'default', 'Pesantren Default', 'active'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'default');

-- ============ 3. Link profil_pesantren → tenant ============
ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

UPDATE profil_pesantren pp
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND pp.tenant_id IS NULL;

-- ============ 4. tenant_id pada users (nullable = platform admin future) ============
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

UPDATE users u
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND u.tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);

COMMIT;

-- Verifikasi (opsional):
-- SELECT id, slug, nama, status FROM tenants;
-- SELECT id, username, tenant_id FROM users;
-- SELECT id, nama_pesantren, tenant_id FROM profil_pesantren;
