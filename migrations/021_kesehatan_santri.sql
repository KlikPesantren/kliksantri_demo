-- Sprint W14 — Modul Kesehatan Santri
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/021_kesehatan_santri.sql

CREATE TABLE IF NOT EXISTS kesehatan_santri (
    id SERIAL PRIMARY KEY,

    santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,

    status_kesehatan VARCHAR(20) NOT NULL DEFAULT 'sehat',

    keluhan TEXT,

    tindakan_pertama TEXT,

    status_penanganan VARCHAR(50) NOT NULL DEFAULT 'observasi',

    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kesehatan_santri_santri
ON kesehatan_santri(santri_id);

CREATE INDEX IF NOT EXISTS idx_kesehatan_santri_created
ON kesehatan_santri(created_at DESC);

-- RBAC permissions
INSERT INTO permissions (key, label, grup) VALUES
  ('kesehatan.view',   'Lihat Kesehatan Santri',  'kesehatan'),
  ('kesehatan.manage', 'Kelola Kesehatan Santri', 'kesehatan')
ON CONFLICT (key) DO NOTHING;

-- superadmin: already has all permissions via CROSS JOIN

-- keamanan: add kesehatan grup
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.grup = 'kesehatan'
WHERE r.name = 'keamanan'
ON CONFLICT DO NOTHING;

-- pendidikan & sekretaris: view only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.key = 'kesehatan.view'
WHERE r.name IN ('pendidikan', 'sekretaris')
ON CONFLICT DO NOTHING;
