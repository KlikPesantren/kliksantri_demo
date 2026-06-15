-- Sprint W14 Hotfix — superadmin missing kesehatan permissions
-- Run: node scripts/run-kesehatan-permissions-hotfix.js
--   or: psql -U postgres -d "Administrasi Santri Digital" -f migrations/022_fix_superadmin_kesehatan_permissions.sql

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
ON p.key IN (
  'kesehatan.view',
  'kesehatan.manage'
)
WHERE r.name = 'superadmin'
ON CONFLICT DO NOTHING;
