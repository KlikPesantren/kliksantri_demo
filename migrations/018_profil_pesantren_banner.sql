-- ============================================================
-- KlikSantri — Banner Pesantren (Profil Pesantren extension)
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/018_profil_pesantren_banner.sql
-- ============================================================

ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS banner_active BOOLEAN NOT NULL DEFAULT TRUE;
