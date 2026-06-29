-- =============================================================
-- Kelas scoped access for Absensi Santri
-- Idempotent and tenant-safe.
-- =============================================================

CREATE TABLE IF NOT EXISTS user_kelas_scope (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tenant_id, user_id, kelas_id)
);

CREATE INDEX IF NOT EXISTS idx_user_kelas_scope_tenant_id
  ON user_kelas_scope (tenant_id);

CREATE INDEX IF NOT EXISTS idx_user_kelas_scope_user_id
  ON user_kelas_scope (user_id);

CREATE INDEX IF NOT EXISTS idx_user_kelas_scope_kelas_id
  ON user_kelas_scope (kelas_id);

INSERT INTO permissions (key, label, grup) VALUES
  ('absensi.manage', 'Kelola Absensi Santri', 'absensi')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key = 'absensi.manage'
WHERE r.name = 'superadmin'
ON CONFLICT DO NOTHING;
