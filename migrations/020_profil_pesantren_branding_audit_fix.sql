-- ============================================================
-- KlikSantri — Profil Pesantren branding columns (audit fix)
-- Idempotent: aman dijalankan ulang, tidak menghapus data lama.
--
-- Run:
--   psql -U postgres -d "Administrasi Santri Digital" -f migrations/020_profil_pesantren_branding_audit_fix.sql
--
-- Mencakup:
--   018_profil_pesantren_banner.sql
--   019_profil_pesantren_white_label.sql
-- ============================================================

BEGIN;

-- 018 — Banner Pesantren
ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);

ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS banner_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 019 — White Label Branding
ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS splash_logo_url VARCHAR(500);

ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS app_icon_url VARCHAR(500);

ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS tagline VARCHAR(200);

ALTER TABLE profil_pesantren
  ADD COLUMN IF NOT EXISTS tentang TEXT;

-- Backfill aman jika banner_active pernah ditambahkan nullable (edge case)
UPDATE profil_pesantren
SET banner_active = TRUE
WHERE banner_active IS NULL;

COMMIT;

-- Verifikasi (opsional — hapus komentar untuk cek manual di psql)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profil_pesantren'
-- ORDER BY ordinal_position;
