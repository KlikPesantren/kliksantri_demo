BEGIN;

ALTER TABLE tenant_domains ADD COLUMN IF NOT EXISTS dns_managed BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tenant_domains DROP CONSTRAINT IF EXISTS tenant_domains_domain_type_check;
UPDATE tenant_domains SET domain_type = 'platform_subdomain' WHERE domain_type IN ('subdomain', 'platform_subdomain');
UPDATE tenant_domains SET domain_type = 'custom_domain', dns_managed = FALSE WHERE domain_type IN ('custom', 'custom_domain');
UPDATE tenant_domains SET dns_managed = TRUE WHERE domain_type = 'platform_subdomain';

ALTER TABLE tenant_domains ALTER COLUMN domain_type SET DEFAULT 'platform_subdomain';
ALTER TABLE tenant_domains ADD CONSTRAINT tenant_domains_domain_type_check
  CHECK (domain_type IN ('platform_subdomain', 'custom_domain'));

COMMIT;

