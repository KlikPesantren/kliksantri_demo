-- Wali JWT revocation through per-account token versioning.
-- IMPORTANT: create only; do not run automatically from application startup.

BEGIN;

ALTER TABLE wali_akun
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wali_akun_token_version_nonnegative'
      AND conrelid = 'wali_akun'::regclass
  ) THEN
    ALTER TABLE wali_akun
      ADD CONSTRAINT wali_akun_token_version_nonnegative
      CHECK (token_version >= 0);
  END IF;
END
$$;

COMMENT ON COLUMN wali_akun.token_version IS
  'Incremented when Wali credentials change; JWT with an older version is rejected.';

COMMIT;
