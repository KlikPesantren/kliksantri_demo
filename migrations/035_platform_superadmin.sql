-- ============================================================
-- KlikSantri — Step 3.1: Platform Superadmin Foundation
-- Run: node scripts/run-migration-035.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

-- ============ 1. Role platform_superadmin ============
INSERT INTO roles (name, label, is_system)
VALUES ('platform_superadmin', 'Platform Superadmin', true)
ON CONFLICT (name) DO UPDATE SET
  label = EXCLUDED.label,
  is_system = EXCLUDED.is_system;

-- ============ 2. Permissions platform.* ============
INSERT INTO permissions (key, label, grup) VALUES
  ('platform.tenant.view',    'Lihat Tenant Platform',    'platform'),
  ('platform.tenant.create',  'Buat Tenant Platform',     'platform'),
  ('platform.tenant.update',  'Ubah Tenant Platform',     'platform'),
  ('platform.tenant.suspend', 'Suspend Tenant Platform',  'platform')
ON CONFLICT (key) DO NOTHING;

-- ============ 3. Assign platform.* → platform_superadmin ============
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'platform_superadmin'
  AND p.grup = 'platform'
ON CONFLICT DO NOTHING;

-- ============ 4. Username unique: per-tenant + platform ============
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;

DROP INDEX IF EXISTS users_username_key;
DROP INDEX IF EXISTS users_tenant_username_key;
DROP INDEX IF EXISTS users_platform_username_key;

CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_username_key
  ON users (tenant_id, username)
  WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_platform_username_key
  ON users (username)
  WHERE tenant_id IS NULL;

COMMIT;
