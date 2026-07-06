CREATE TABLE IF NOT EXISTS wali_home_links (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'other',
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wali_home_links_tenant_id
  ON wali_home_links (tenant_id);

CREATE INDEX IF NOT EXISTS idx_wali_home_links_active_order
  ON wali_home_links (tenant_id, is_active, sort_order, id);
