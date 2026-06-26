-- ============================================================
-- Migration 048 - Wali app in-app notifications
-- Phase 1 only: stored notifications visible inside Wali app.
-- No Expo push token, Firebase, or device push integration.
-- ============================================================

CREATE TABLE IF NOT EXISTS wali_in_app_notifications (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wali_akun_id INTEGER NOT NULL REFERENCES wali_akun(id) ON DELETE CASCADE,
  santri_id INTEGER REFERENCES santri(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'generic',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wali_in_app_notifications_wali
  ON wali_in_app_notifications (tenant_id, wali_akun_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wali_in_app_notifications_unread
  ON wali_in_app_notifications (tenant_id, wali_akun_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wali_in_app_notifications_santri
  ON wali_in_app_notifications (tenant_id, santri_id, created_at DESC);
