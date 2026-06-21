-- ============================================================
-- ROLLBACK — Multi-Tenant Step 1 (027_tenants_foundation.sql)
-- PERINGATAN: Hanya jalankan jika Step 1 perlu dibatalkan.
-- Data di tabel tenants akan hilang. users.tenant_id di-drop.
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_users_tenant_id;

ALTER TABLE users
  DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE profil_pesantren
  DROP COLUMN IF EXISTS tenant_id;

DROP INDEX IF EXISTS idx_tenants_slug;
DROP INDEX IF EXISTS idx_tenants_status;

DROP TABLE IF EXISTS tenants;

COMMIT;
