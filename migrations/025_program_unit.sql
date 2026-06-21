-- =============================================================
-- PHASE 5: Program Unit & Evaluasi Program
-- Additive only — idempotent
-- =============================================================

-- ============ PROGRAM UNIT ============
CREATE TABLE IF NOT EXISTS program_unit (
  id                SERIAL PRIMARY KEY,
  unit_id           INTEGER NOT NULL REFERENCES unit_pendidikan(id),
  nama_program      VARCHAR(200) NOT NULL,
  deskripsi         TEXT,
  target_program    VARCHAR(500),
  target_angka      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  realisasi_angka   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  penanggung_jawab  VARCHAR(150),
  tanggal_mulai     DATE,
  tanggal_selesai   DATE,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT program_unit_status_check
    CHECK (status IN ('draft', 'berjalan', 'selesai', 'dibatalkan')),
  CONSTRAINT program_unit_target_angka_check
    CHECK (target_angka >= 0),
  CONSTRAINT program_unit_realisasi_angka_check
    CHECK (realisasi_angka >= 0)
);

CREATE INDEX IF NOT EXISTS idx_program_unit_unit_status
  ON program_unit (unit_id, status);

CREATE INDEX IF NOT EXISTS idx_program_unit_status
  ON program_unit (status);

-- ============ EVALUASI PROGRAM ============
CREATE TABLE IF NOT EXISTS program_unit_evaluasi (
  id            SERIAL PRIMARY KEY,
  program_id    INTEGER NOT NULL REFERENCES program_unit(id) ON DELETE CASCADE,
  bulan         SMALLINT NOT NULL,
  tahun         INTEGER NOT NULL,
  progress      SMALLINT NOT NULL DEFAULT 0,
  kendala       TEXT,
  solusi        TEXT,
  catatan       TEXT,
  efektivitas   VARCHAR(30) NOT NULL,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT program_unit_evaluasi_bulan_check
    CHECK (bulan >= 1 AND bulan <= 12),
  CONSTRAINT program_unit_evaluasi_tahun_check
    CHECK (tahun >= 2000 AND tahun <= 2100),
  CONSTRAINT program_unit_evaluasi_progress_check
    CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT program_unit_evaluasi_efektivitas_check
    CHECK (efektivitas IN (
      'sangat_efektif',
      'efektif',
      'cukup_efektif',
      'kurang_efektif',
      'tidak_efektif'
    )),
  CONSTRAINT program_unit_evaluasi_unique_periode
    UNIQUE (program_id, bulan, tahun)
);

CREATE INDEX IF NOT EXISTS idx_program_unit_evaluasi_program
  ON program_unit_evaluasi (program_id, tahun DESC, bulan DESC);

-- ============ PERMISSIONS ============
INSERT INTO permissions (key, label, grup) VALUES
  ('program_unit.view',   'Lihat Program Unit',        'program_unit'),
  ('program_unit.manage', 'Kelola Program Unit',       'program_unit')
ON CONFLICT (key) DO NOTHING;

-- superadmin: semua permission program_unit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin'
  AND p.grup = 'program_unit'
ON CONFLICT DO NOTHING;

-- pimpinan_yayasan: view only (lintas unit)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key = 'program_unit.view'
WHERE r.name = 'pimpinan_yayasan'
ON CONFLICT DO NOTHING;

-- bendahara_unit / staff unit: view + manage unit sendiri
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN ('program_unit.view', 'program_unit.manage')
WHERE r.name = 'bendahara_unit'
ON CONFLICT DO NOTHING;
