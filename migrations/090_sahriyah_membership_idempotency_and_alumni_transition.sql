BEGIN;

-- Forward-only hardening. This migration never updates Sahriyah, payment, or cash rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tagihan_sahriyah'
      AND column_name IN ('tenant_id','unit_id','santri_id','santri_unit_id','bulan','tahun')
    GROUP BY table_name
    HAVING COUNT(*) = 6
  ) THEN
    RAISE EXCEPTION '090 blocked: tagihan_sahriyah canonical ownership/period columns are incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sahriyah_setting'
      AND column_name IN ('tenant_id','unit_id','santri_id','santri_unit_id','legacy_resolution_status')
    GROUP BY table_name
    HAVING COUNT(*) = 5
  ) OR to_regclass('public.santri_units') IS NULL
       OR to_regclass('public.alumni_units') IS NULL THEN
    RAISE EXCEPTION '090 blocked: canonical membership, Sahriyah setting, or Alumni unit schema is incomplete';
  END IF;

  IF to_regclass('public.tagihan_sahriyah_tenant_santri_bulan_tahun_key') IS NULL
     AND to_regclass('public.uq_tagihan_sahriyah_membership_period') IS NULL THEN
    RAISE EXCEPTION '090 blocked: expected old Sahriyah uniqueness is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tagihan_sahriyah
    WHERE unit_id IS NOT NULL AND santri_unit_id IS NOT NULL
    GROUP BY tenant_id, unit_id, santri_unit_id, bulan, tahun
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION '090 blocked: canonical Sahriyah membership-period duplicates require review';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tagihan_sahriyah
    WHERE unit_id IS NULL OR santri_unit_id IS NULL
    GROUP BY tenant_id, santri_id, bulan, tahun
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION '090 blocked: legacy Sahriyah identity-period duplicates require review';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tagihan_sahriyah_membership_period
  ON tagihan_sahriyah (tenant_id, unit_id, santri_unit_id, bulan, tahun)
  WHERE unit_id IS NOT NULL AND santri_unit_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tagihan_sahriyah_legacy_identity_period
  ON tagihan_sahriyah (tenant_id, santri_id, bulan, tahun)
  WHERE unit_id IS NULL OR santri_unit_id IS NULL;

DO $$
BEGIN
  IF to_regclass('public.uq_tagihan_sahriyah_membership_period') IS NULL
     OR to_regclass('public.uq_tagihan_sahriyah_legacy_identity_period') IS NULL THEN
    RAISE EXCEPTION '090 blocked: replacement Sahriyah indexes were not created';
  END IF;
END $$;

ALTER TABLE tagihan_sahriyah
  DROP CONSTRAINT IF EXISTS tagihan_sahriyah_tenant_santri_bulan_tahun_key;
DROP INDEX IF EXISTS tagihan_sahriyah_tenant_santri_bulan_tahun_key;

-- Nullable by design: legacy Alumni history remains untouched and un-inferred.
ALTER TABLE alumni_units
  ADD COLUMN IF NOT EXISTS source_santri_unit_id BIGINT,
  ADD COLUMN IF NOT EXISTS effective_exit_at DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alumni_units_source_membership_tenant_fkey'
      AND conrelid = 'public.alumni_units'::regclass
  ) THEN
    ALTER TABLE alumni_units
      ADD CONSTRAINT alumni_units_source_membership_tenant_fkey
      FOREIGN KEY (tenant_id, source_santri_unit_id)
      REFERENCES santri_units(tenant_id, id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_alumni_units_source_membership
  ON alumni_units (tenant_id, source_santri_unit_id)
  WHERE source_santri_unit_id IS NOT NULL;

ALTER TABLE alumni_units
  VALIDATE CONSTRAINT alumni_units_source_membership_tenant_fkey;

COMMIT;
