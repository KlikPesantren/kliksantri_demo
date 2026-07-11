BEGIN;

CREATE TABLE IF NOT EXISTS tenant_domains (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname VARCHAR(255) NOT NULL UNIQUE,
  domain_type VARCHAR(30) NOT NULL DEFAULT 'subdomain',
  provider VARCHAR(30) NOT NULL DEFAULT 'klikpesantren',
  dns_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  vercel_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  ssl_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  overall_status VARCHAR(30) NOT NULL DEFAULT 'draft',
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  CONSTRAINT tenant_domains_domain_type_check CHECK (domain_type IN ('subdomain', 'custom')),
  CONSTRAINT tenant_domains_dns_status_check CHECK (dns_status IN ('pending', 'creating', 'active', 'failed')),
  CONSTRAINT tenant_domains_vercel_status_check CHECK (vercel_status IN ('pending', 'adding', 'verified', 'failed')),
  CONSTRAINT tenant_domains_ssl_status_check CHECK (ssl_status IN ('pending', 'issuing', 'active', 'failed')),
  CONSTRAINT tenant_domains_overall_status_check CHECK (overall_status IN ('draft', 'provisioning', 'active', 'failed', 'disabled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_domains_primary_tenant_key
  ON tenant_domains (tenant_id) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS tenant_domains_overall_status_idx
  ON tenant_domains (overall_status);

INSERT INTO tenant_domains (tenant_id, hostname, created_at, updated_at)
SELECT t.id, LOWER(t.slug) || '.klikpesantren.com', NOW(), NOW()
FROM tenants t
WHERE t.status = 'active'
  AND t.slug NOT IN ('www', 'app', 'platform', 'api', 'docs', 'status', 'admin', 'default', 'root', 'system')
  AND t.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
ON CONFLICT (hostname) DO NOTHING;

COMMIT;
