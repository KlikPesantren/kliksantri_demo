-- KlikPesantren - kamar/asrama santri
-- Idempotent; execute through the normal migration runner.

BEGIN;

ALTER TABLE public.santri
  ADD COLUMN IF NOT EXISTS kamar VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_santri_tenant_kamar
  ON public.santri (tenant_id, kamar);

COMMIT;
