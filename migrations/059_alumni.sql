-- Alumni pesantren; linked to santri when historical source is available.

BEGIN;

CREATE TABLE IF NOT EXISTS alumni (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  santri_id INTEGER REFERENCES santri(id) ON DELETE SET NULL,
  nama VARCHAR(150) NOT NULL,
  nis VARCHAR(80),
  jenis_kelamin VARCHAR(20),
  tahun_masuk INTEGER,
  tahun_lulus INTEGER,
  angkatan VARCHAR(80),
  status_kelulusan VARCHAR(20) NOT NULL DEFAULT 'lulus',
  kontak VARCHAR(50),
  alamat TEXT,
  pekerjaan VARCHAR(150),
  catatan TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT alumni_status_kelulusan_check CHECK (status_kelulusan IN ('lulus', 'keluar')),
  CONSTRAINT alumni_tenant_santri_unique UNIQUE (tenant_id, santri_id)
);

CREATE INDEX IF NOT EXISTS idx_alumni_tenant_nama ON alumni (tenant_id, nama);
CREATE INDEX IF NOT EXISTS idx_alumni_tenant_tahun ON alumni (tenant_id, tahun_lulus);

INSERT INTO alumni (
  tenant_id, santri_id, nama, nis, jenis_kelamin, alamat, status_kelulusan
)
SELECT s.tenant_id, s.id, s.nama, s.nis, s.jenis_kelamin, s.alamat,
       CASE WHEN LOWER(COALESCE(s.status, '')) = 'keluar' THEN 'keluar' ELSE 'lulus' END
FROM santri s
WHERE LOWER(COALESCE(s.status, '')) IN ('lulus', 'keluar')
ON CONFLICT (tenant_id, santri_id) DO NOTHING;

COMMIT;
