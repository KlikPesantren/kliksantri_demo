-- ============================================================
-- Migration 049 - Wali device tokens for Expo push notification
-- Phase 2: HP push notification via Expo Notifications.
-- ============================================================

CREATE TABLE IF NOT EXISTS wali_device_tokens (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wali_id INTEGER NOT NULL REFERENCES wali_akun(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform VARCHAR(50),
  device_name VARCHAR(150),
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tenant_id, wali_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_wali_device_tokens_tenant
  ON wali_device_tokens (tenant_id);

CREATE INDEX IF NOT EXISTS idx_wali_device_tokens_wali
  ON wali_device_tokens (wali_id);

CREATE INDEX IF NOT EXISTS idx_wali_device_tokens_expo_push_token
  ON wali_device_tokens (expo_push_token);

CREATE INDEX IF NOT EXISTS idx_wali_device_tokens_is_active
  ON wali_device_tokens (is_active);
