-- Migration 040: tahun berdiri on profil_pesantren
-- Run: node scripts/run-migration-040.js

ALTER TABLE profil_pesantren
ADD COLUMN IF NOT EXISTS tahun_berdiri INTEGER;

COMMENT ON COLUMN profil_pesantren.tahun_berdiri IS 'Tahun berdiri pesantren (nullable, 4 digit)';
