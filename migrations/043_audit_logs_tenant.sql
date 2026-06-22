-- ============================================================
-- KlikSantri — MT-1: audit_logs tenant scope (nullable)
-- Run: node scripts/run-migration-043.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

UPDATE audit_logs al
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'default'
  AND al.tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id
  ON audit_logs (tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON audit_logs (tenant_id, created_at DESC);

COMMIT;
