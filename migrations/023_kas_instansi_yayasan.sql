-- =============================================================
-- PHASE 1: Kas Instansi Yayasan
-- Additive only — tidak menyentuh buku_kas
-- Aman dijalankan ulang (IF NOT EXISTS / ON CONFLICT)
-- =============================================================

-- ============ MASTER UNIT PENDIDIKAN ============
CREATE TABLE IF NOT EXISTS unit_pendidikan (
  id          SERIAL PRIMARY KEY,
  kode        VARCHAR(20) UNIQUE NOT NULL,
  nama        VARCHAR(100) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO unit_pendidikan (kode, nama, sort_order) VALUES
  ('PAUD',  'PAUD/TK',           1),
  ('MADIN', 'Madrasah Diniyah',  2),
  ('SMP',   'SMP',               3),
  ('SMA',   'SMA',               4)
ON CONFLICT (kode) DO NOTHING;

-- ============ TRANSAKSI KAS INSTANSI ============
CREATE TABLE IF NOT EXISTS kas_instansi_transaksi (
  id          SERIAL PRIMARY KEY,
  unit_id     INTEGER NOT NULL REFERENCES unit_pendidikan(id),
  tanggal     DATE NOT NULL,
  jenis       VARCHAR(20) NOT NULL,
  kategori    VARCHAR(100) NOT NULL,
  keterangan  TEXT,
  nominal     BIGINT NOT NULL,
  petugas     VARCHAR(100),
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT kas_instansi_transaksi_jenis_check
    CHECK (jenis IN ('Masuk', 'Keluar')),
  CONSTRAINT kas_instansi_transaksi_nominal_check
    CHECK (nominal > 0)
);

CREATE INDEX IF NOT EXISTS idx_kas_instansi_transaksi_unit_tanggal
  ON kas_instansi_transaksi (unit_id, tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_kas_instansi_transaksi_unit_jenis
  ON kas_instansi_transaksi (unit_id, jenis);

-- ============ SCOPE BENDAHARA → UNIT ============
CREATE TABLE IF NOT EXISTS user_unit_scope (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id     INTEGER NOT NULL REFERENCES unit_pendidikan(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, unit_id)
);

-- ============ PERMISSIONS BARU ============
INSERT INTO permissions (key, label, grup) VALUES
  ('kas_instansi.view',         'Lihat Kas Instansi',              'kas_instansi'),
  ('kas_instansi.manage',       'Kelola Transaksi Kas Instansi',   'kas_instansi'),
  ('kas_instansi.konsolidasi',  'Dashboard Konsolidasi Kas',       'kas_instansi'),
  ('kas_instansi.export',       'Export Laporan Kas Instansi',     'kas_instansi')
ON CONFLICT (key) DO NOTHING;

-- ============ ROLES BARU ============
INSERT INTO roles (name, label, is_system) VALUES
  ('pimpinan_yayasan', 'Pimpinan Yayasan', true),
  ('bendahara_unit',   'Bendahara Unit',   true)
ON CONFLICT (name) DO NOTHING;

-- ============ ROLE PERMISSIONS ============

-- superadmin: semua permission kas_instansi
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin'
  AND p.grup = 'kas_instansi'
ON CONFLICT DO NOTHING;

-- pimpinan_yayasan: lihat + konsolidasi + export (TIDAK manage)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'dashboard.view',
  'kas_instansi.view',
  'kas_instansi.konsolidasi',
  'kas_instansi.export'
)
WHERE r.name = 'pimpinan_yayasan'
ON CONFLICT DO NOTHING;

-- bendahara_unit: kelola unit sendiri
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'dashboard.view',
  'kas_instansi.view',
  'kas_instansi.manage',
  'kas_instansi.export'
)
WHERE r.name = 'bendahara_unit'
ON CONFLICT DO NOTHING;
