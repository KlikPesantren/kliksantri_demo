-- ============================================================
-- KlikSantri — White Label Branding (Profil Pesantren extension)
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/019_profil_pesantren_white_label.sql
-- ============================================================

ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS splash_logo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS app_icon_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS tagline VARCHAR(200),
  ADD COLUMN IF NOT EXISTS tentang TEXT;
