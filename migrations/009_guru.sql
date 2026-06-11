-- Tabel master guru / pegawai pesantren
CREATE TABLE IF NOT EXISTS guru (
  id      SERIAL PRIMARY KEY,
  nama    VARCHAR(150) NOT NULL,
  jabatan VARCHAR(100)
);

-- Tabel rekapitulasi absensi guru per bulan
CREATE TABLE IF NOT EXISTS absensi_guru (
  id           SERIAL PRIMARY KEY,
  guru_id      INTEGER NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
  bulan        INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun        INTEGER NOT NULL,
  total_hadir  INTEGER DEFAULT 0,
  total_izin   INTEGER DEFAULT 0,
  total_sakit  INTEGER DEFAULT 0,
  total_alfa   INTEGER DEFAULT 0,
  UNIQUE (guru_id, bulan, tahun)
);
