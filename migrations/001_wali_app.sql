-- ============================================================
-- KlikSantri — Wali App MVP (additive tables only)
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/001_wali_app.sql
-- ============================================================

-- ------------------------------------------------------------
-- wali_akun — autentikasi wali (HP + PIN)
-- Relasi ke wali_santri via nomor_hp (logical, tanpa FK ke existing)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wali_akun (
  id SERIAL PRIMARY KEY,
  nomor_hp VARCHAR(20) NOT NULL UNIQUE,
  pin_hash VARCHAR(255) NOT NULL,
  nama VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  must_change_pin BOOLEAN NOT NULL DEFAULT true,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wali_akun_nomor_hp
  ON wali_akun (nomor_hp);

CREATE INDEX IF NOT EXISTS idx_wali_akun_status
  ON wali_akun (status);

-- ------------------------------------------------------------
-- pengumuman — modul pengumuman (read wali-app, CRUD admin later)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pengumuman (
  id SERIAL PRIMARY KEY,
  judul VARCHAR(200) NOT NULL,
  isi TEXT NOT NULL,
  prioritas VARCHAR(20) NOT NULL DEFAULT 'normal',
  published_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pengumuman_active
  ON pengumuman (is_active, published_at DESC);

-- ------------------------------------------------------------
-- profil_pesantren — singleton info pesantren
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profil_pesantren (
  id SERIAL PRIMARY KEY,
  nama_pesantren VARCHAR(200) NOT NULL,
  alamat TEXT,
  telepon VARCHAR(30),
  email VARCHAR(100),
  website VARCHAR(200),
  logo_url VARCHAR(500),
  visi TEXT,
  misi TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- wali_app_audit — audit login & aktivitas wali
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wali_app_audit (
  id SERIAL PRIMARY KEY,
  nomor_hp VARCHAR(20),
  event VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wali_app_audit_nomor_hp
  ON wali_app_audit (nomor_hp, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wali_app_audit_event
  ON wali_app_audit (event, created_at DESC);
