-- ============================================================
-- Master mata pelajaran dan kurikulum per kelas
-- Jalankan melalui migration runner setelah direview.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS mata_pelajaran (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nama VARCHAR(120) NOT NULL,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, nama)
);

CREATE TABLE IF NOT EXISTS kelas_mata_pelajaran (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  mata_pelajaran_id INTEGER NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  urutan SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, kelas_id, mata_pelajaran_id)
);

CREATE INDEX IF NOT EXISTS idx_mata_pelajaran_tenant
  ON mata_pelajaran (tenant_id, aktif, nama);
CREATE INDEX IF NOT EXISTS idx_kelas_mata_pelajaran_kelas
  ON kelas_mata_pelajaran (tenant_id, kelas_id, urutan);

WITH defaults(nama, urutan) AS (
  VALUES
    ('Nahwu', 1), ('Fiqih', 2), ('Tajwid', 3), ('Akhlak', 4), ('Tauhid', 5)
)
INSERT INTO mata_pelajaran (tenant_id, nama)
SELECT t.id, d.nama
FROM tenants t CROSS JOIN defaults d
ON CONFLICT (tenant_id, nama) DO NOTHING;

WITH defaults(nama, urutan) AS (
  VALUES
    ('Nahwu', 1), ('Fiqih', 2), ('Tajwid', 3), ('Akhlak', 4), ('Tauhid', 5)
)
INSERT INTO kelas_mata_pelajaran (tenant_id, kelas_id, mata_pelajaran_id, urutan)
SELECT k.tenant_id, k.id, mp.id, d.urutan
FROM kelas k
JOIN mata_pelajaran mp ON mp.tenant_id = k.tenant_id
JOIN defaults d ON d.nama = mp.nama
ON CONFLICT (tenant_id, kelas_id, mata_pelajaran_id) DO NOTHING;

COMMIT;
