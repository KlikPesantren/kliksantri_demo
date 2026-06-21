-- ============================================================
-- KlikSantri — Santri import Excel columns
-- Run: node scripts/run-migration-038.js
-- Idempotent.
-- ============================================================

BEGIN;

ALTER TABLE santri
  ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(1);

ALTER TABLE santri
  ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;

COMMIT;
