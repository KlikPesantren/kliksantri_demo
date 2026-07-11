const pool = require("../db");
const { validateCustomDomainHostname, normalizeDnsHostname } = require("./domainHostnameService");

async function createCustomTenantDomain({ tenantId, hostname }, actorUserId, db = pool) {
  const id = Number(tenantId);
  if (!Number.isInteger(id) || id <= 0) { const error = new Error("tenantId tidak valid"); error.status = 400; throw error; }
  const normalized = validateCustomDomainHostname(hostname);
  const tenantResult = await db.query("SELECT id, slug, nama, status FROM tenants WHERE id = $1", [id]);
  if (!tenantResult.rows[0]) { const error = new Error("Tenant tidak ditemukan"); error.status = 404; throw error; }
  const existing = await db.query("SELECT * FROM tenant_domains WHERE hostname = $1", [normalized]);
  if (existing.rows[0]) {
    if (Number(existing.rows[0].tenant_id) === id) return { ...existing.rows[0], idempotent: true };
    const error = new Error("Hostname sudah digunakan tenant lain"); error.status = 409; throw error;
  }
  const { rows } = await db.query(
    `INSERT INTO tenant_domains (tenant_id, hostname, domain_type, provider, dns_managed,
       dns_status, vercel_status, ssl_status, overall_status, is_primary, created_by, updated_by)
     VALUES ($1, $2, 'custom_domain', 'vercel', FALSE, 'pending', 'pending', 'pending', 'provisioning', FALSE, $3, $3)
     RETURNING *`,
    [id, normalized, actorUserId || null]
  );
  return rows[0];
}

async function resolveActiveTenantByHostname(hostHeader, db = pool) {
  const withoutPort = String(hostHeader || "").trim().toLowerCase().replace(/:\d+$/, "");
  const hostname = normalizeDnsHostname(withoutPort);
  if (!hostname) return null;
  const { rows } = await db.query(
    `SELECT td.id AS domain_id, td.hostname, td.tenant_id, td.domain_type,
            t.slug, t.nama, t.status, t.logo_url, t.tagline, t.alamat, t.telepon
     FROM tenant_domains td JOIN tenants t ON t.id = td.tenant_id
     WHERE td.hostname = $1 AND td.overall_status = 'active' AND t.status = 'active'
     LIMIT 1`, [hostname]
  );
  return rows[0] || null;
}

module.exports = { createCustomTenantDomain, resolveActiveTenantByHostname };
