BEGIN;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tenant_display_name VARCHAR(160);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_display_name_not_blank'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_display_name_not_blank
      CHECK (tenant_display_name IS NULL OR BTRIM(tenant_display_name) <> '');
  END IF;
END $$;

COMMENT ON COLUMN tenants.tenant_display_name IS
  'Optional short tenant brand used by Admin/PWA; canonical institution name remains tenants.nama.';

COMMIT;
