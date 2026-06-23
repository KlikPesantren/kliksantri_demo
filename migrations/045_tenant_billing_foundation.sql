-- ============================================================
-- KlikSantri MT-12 - Tenant Billing Foundation
-- Run: node scripts/run-migration-045.js
-- Idempotent where possible.
-- ============================================================

BEGIN;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan_code VARCHAR(30),
  ADD COLUMN IF NOT EXISTS billing_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS next_invoice_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS billing_notes TEXT;

UPDATE tenants
SET
  plan_code = COALESCE(plan_code, 'premium'),
  billing_status = COALESCE(billing_status, 'active'),
  subscription_started_at = COALESCE(subscription_started_at, NOW()),
  subscription_expires_at = COALESCE(subscription_expires_at, NOW() + INTERVAL '30 days')
WHERE
  plan_code IS NULL
  OR billing_status IS NULL
  OR subscription_started_at IS NULL
  OR subscription_expires_at IS NULL;

ALTER TABLE tenants
  ALTER COLUMN plan_code SET DEFAULT 'premium',
  ALTER COLUMN billing_status SET DEFAULT 'active',
  ALTER COLUMN subscription_started_at SET DEFAULT NOW(),
  ALTER COLUMN subscription_expires_at SET DEFAULT (NOW() + INTERVAL '30 days');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_billing_status_check'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_billing_status_check
      CHECK (
        billing_status IS NULL
        OR billing_status IN ('trial', 'active', 'overdue', 'suspended', 'cancelled')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_plan_code_check'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_plan_code_check
      CHECK (
        plan_code IS NULL
        OR plan_code IN ('basic', 'standard', 'premium', 'custom')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_billing_status
  ON tenants (billing_status);

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_expires_at
  ON tenants (subscription_expires_at);

CREATE INDEX IF NOT EXISTS idx_tenants_plan_code
  ON tenants (plan_code);

COMMIT;
