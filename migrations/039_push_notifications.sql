-- ============================================================
-- Migration 039 — Push notification foundation (wali app)
-- Tables: wali_push_tokens, notification_logs
-- No event triggers wired yet.
-- ============================================================

CREATE TABLE IF NOT EXISTS wali_push_tokens (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wali_akun_id INTEGER NOT NULL REFERENCES wali_akun(id) ON DELETE CASCADE,
  expo_push_token VARCHAR(255) NOT NULL,
  device_id VARCHAR(128),
  platform VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wali_push_tokens_tenant_token
  ON wali_push_tokens (tenant_id, expo_push_token);

CREATE INDEX IF NOT EXISTS idx_wali_push_tokens_wali
  ON wali_push_tokens (tenant_id, wali_akun_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_wali_push_tokens_last_seen
  ON wali_push_tokens (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wali_akun_id INTEGER NOT NULL REFERENCES wali_akun(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'generic',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  provider VARCHAR(30) NOT NULL DEFAULT 'expo',
  provider_ticket_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_wali
  ON notification_logs (tenant_id, wali_akun_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_status
  ON notification_logs (status, created_at DESC);
