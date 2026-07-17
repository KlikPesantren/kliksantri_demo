-- Explicit module permissions for unit-aware role matrix.
BEGIN;

INSERT INTO permissions (key, label, grup) VALUES
  ('alumni.view', 'Lihat Alumni Pesantren', 'alumni'),
  ('alumni.manage', 'Kelola Alumni Pesantren', 'alumni'),
  ('konten_pesantren.view', 'Lihat Konten Pesantren', 'konten_pesantren'),
  ('konten_pesantren.manage', 'Kelola Konten Pesantren', 'konten_pesantren'),
  ('wallet.view', 'Lihat Dompet', 'wallet'),
  ('wallet.manage', 'Kelola Dompet', 'wallet')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, grup = EXCLUDED.grup;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'superadmin'
  AND p.key IN ('alumni.view', 'alumni.manage', 'konten_pesantren.view', 'konten_pesantren.manage', 'wallet.view', 'wallet.manage')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'sekretaris'
  AND p.key IN ('alumni.view', 'alumni.manage', 'konten_pesantren.view', 'konten_pesantren.manage')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('pendidikan', 'keuangan')
  AND p.key IN ('wallet.view', 'wallet.manage')
ON CONFLICT DO NOTHING;

COMMIT;
