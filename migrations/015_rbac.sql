-- =============================================================
-- RBAC: roles, permissions, role_permissions
-- Aman dijalankan ulang. users.role (string) tetap = roles.name
-- Seed mencerminkan matrix akses yang berlaku saat ini (nol regresi)
-- =============================================================

-- ============ STRUKTUR ============
CREATE TABLE IF NOT EXISTS roles (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) UNIQUE NOT NULL,
  label      VARCHAR(100),
  is_system  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(80) UNIQUE NOT NULL,
  label      VARCHAR(150),
  grup       VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============ SEED ROLES ============
INSERT INTO roles (name, label, is_system) VALUES
  ('superadmin', 'Super Admin', true),
  ('pendidikan', 'Pendidikan',  true),
  ('keuangan',   'Keuangan',    true),
  ('keamanan',   'Keamanan',    true),
  ('sekretaris', 'Sekretaris',  true)
ON CONFLICT (name) DO NOTHING;

-- ============ SEED PERMISSIONS ============
INSERT INTO permissions (key, label, grup) VALUES
  ('dashboard.view',      'Lihat Dashboard',        'dashboard'),
  ('santri.view',         'Lihat Santri',           'santri'),
  ('santri.create',       'Tambah Santri',          'santri'),
  ('santri.update',       'Ubah Santri',            'santri'),
  ('santri.delete',       'Hapus Santri',           'santri'),
  ('kelas.view',          'Lihat Kelas',            'kelas'),
  ('kelas.manage',        'Kelola Kelas',           'kelas'),
  ('wali.view',           'Lihat Wali',             'wali'),
  ('wali.manage',         'Kelola Wali',            'wali'),
  ('guru.view',           'Lihat Guru',             'guru'),
  ('guru.create',         'Tambah Guru',            'guru'),
  ('guru.update',         'Ubah Guru',              'guru'),
  ('guru.delete',         'Hapus Guru',             'guru'),
  ('absensi.view',        'Lihat Absensi',          'absensi'),
  ('absensi.create',      'Isi Absensi',            'absensi'),
  ('absensi.update',      'Ubah Absensi',           'absensi'),
  ('absensi_guru.view',   'Lihat Absensi Guru',     'absensi_guru'),
  ('absensi_guru.manage', 'Kelola Absensi Guru',    'absensi_guru'),
  ('hafalan.view',        'Lihat Hafalan',          'hafalan'),
  ('hafalan.manage',      'Kelola Hafalan',         'hafalan'),
  ('nilai.view',          'Lihat Nilai',            'nilai'),
  ('nilai.manage',        'Kelola Nilai',           'nilai'),
  ('tagihan.view',        'Lihat Tagihan',          'tagihan'),
  ('tagihan.create',      'Tambah Tagihan',         'tagihan'),
  ('tagihan.update',      'Ubah Tagihan',           'tagihan'),
  ('tagihan.delete',      'Hapus Tagihan',          'tagihan'),
  ('pembayaran.view',     'Lihat Pembayaran',       'pembayaran'),
  ('pembayaran.manage',   'Kelola Pembayaran',      'pembayaran'),
  ('bukukas.view',        'Lihat Buku Kas',         'bukukas'),
  ('bukukas.manage',      'Kelola Buku Kas',        'bukukas'),
  ('sahriyah.view',       'Lihat Sahriyah',         'sahriyah'),
  ('sahriyah.manage',     'Kelola Sahriyah',        'sahriyah'),
  ('pelanggaran.view',    'Lihat Pelanggaran',      'pelanggaran'),
  ('pelanggaran.create',  'Tambah Pelanggaran',     'pelanggaran'),
  ('pelanggaran.update',  'Ubah Pelanggaran',       'pelanggaran'),
  ('perizinan.view',      'Lihat Perizinan',        'perizinan'),
  ('perizinan.create',    'Tambah Perizinan',       'perizinan'),
  ('perizinan.update',    'Ubah Perizinan',         'perizinan'),
  ('tamu.view',           'Lihat Tamu',             'tamu'),
  ('tamu.manage',         'Kelola Tamu',            'tamu'),
  ('pengumuman.view',     'Lihat Pengumuman',       'pengumuman'),
  ('pengumuman.manage',   'Kelola Pengumuman',      'pengumuman'),
  ('profil.view',         'Lihat Profil Pesantren', 'profil'),
  ('profil.manage',       'Kelola Profil Pesantren','profil'),
  ('rfid.view',           'Lihat RFID',             'rfid'),
  ('rfid.manage',         'Kelola RFID',            'rfid'),
  ('audit.view',          'Lihat Audit',            'audit'),
  ('device.view',         'Lihat Perangkat',        'device'),
  ('device.manage',       'Kelola Perangkat',       'device'),
  ('user.view',           'Lihat User',             'user'),
  ('user.create',         'Tambah User',            'user'),
  ('user.update',         'Ubah User',              'user'),
  ('user.delete',         'Hapus User',             'user'),
  ('role.manage',         'Kelola Role & Hak Akses','role')
ON CONFLICT (key) DO NOTHING;

-- ============ SEED role_permissions ============
-- superadmin: SEMUA permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- pendidikan: dashboard, absensi, absensi_guru, guru, hafalan, nilai
-- CATATAN: guru.delete dikecualikan — hapus guru hanya untuk superadmin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.grup IN
  ('dashboard','absensi','absensi_guru','guru','hafalan','nilai')
WHERE r.name = 'pendidikan'
  AND p.key <> 'guru.delete'
ON CONFLICT DO NOTHING;

-- keuangan: dashboard, pembayaran, tagihan, bukukas, sahriyah, rfid, audit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.grup IN
  ('dashboard','pembayaran','tagihan','bukukas','sahriyah','rfid','audit')
WHERE r.name = 'keuangan'
ON CONFLICT DO NOTHING;

-- keamanan: dashboard, perizinan, pelanggaran, tamu
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.grup IN
  ('dashboard','perizinan','pelanggaran','tamu')
WHERE r.name = 'keamanan'
ON CONFLICT DO NOTHING;

-- sekretaris: dashboard, santri, kelas, wali, pengumuman, profil
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.grup IN
  ('dashboard','santri','kelas','wali','pengumuman','profil')
WHERE r.name = 'sekretaris'
ON CONFLICT DO NOTHING;
