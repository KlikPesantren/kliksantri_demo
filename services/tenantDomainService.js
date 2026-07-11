const pool = require("../db");

const ROOT_DOMAIN = "klikpesantren.com";
const RESERVED_SLUGS = new Set([
  "www", "app", "platform", "api", "docs", "status", "admin",
  "default", "root", "system",
]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOSTNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.klikpesantren\.com$/;
const STATUS_FIELDS = {
  dns_status: new Set(["pending", "creating", "active", "failed"]),
  vercel_status: new Set(["pending", "adding", "verified", "failed"]),
  ssl_status: new Set(["pending", "issuing", "active", "failed"]),
  overall_status: new Set(["draft", "provisioning", "active", "failed", "disabled"]),
};

function ensureReservedSlug(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (RESERVED_SLUGS.has(normalized)) {
    const error = new Error("Slug tidak tersedia untuk domain tenant");
    error.status = 400;
    throw error;
  }
  return normalized;
}

function normalizeTenantSlug(slug) {
  const normalized = ensureReservedSlug(slug);
  if (normalized.length < 3 || normalized.length > 80 || !SLUG_PATTERN.test(normalized)) {
    const error = new Error("Slug domain harus 3-80 karakter, huruf kecil/angka/dash, tanpa dash berulang atau di awal/akhir");
    error.status = 400;
    throw error;
  }
  return normalized;
}

function buildTenantHostname(slug) {
  return `${normalizeTenantSlug(slug)}.${ROOT_DOMAIN}`;
}

function validateTenantHostname(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase().replace(/\.$/, "");
  if (normalized.length > 255 || !HOSTNAME_PATTERN.test(normalized)) {
    const error = new Error("Hostname tenant tidak valid");
    error.status = 400;
    throw error;
  }
  normalizeTenantSlug(normalized.slice(0, -(ROOT_DOMAIN.length + 1)));
  return normalized;
}

async function checkHostnameAvailability(hostname, db = pool) {
  const normalized = validateTenantHostname(hostname);
  const { rows } = await db.query("SELECT id, tenant_id FROM tenant_domains WHERE hostname = $1", [normalized]);
  return { available: rows.length === 0, existing: rows[0] || null, hostname: normalized };
}

async function createDraftDomainForTenant(tenantOrId, platformUser = null, db = pool) {
  let tenant = tenantOrId;
  if (typeof tenantOrId !== "object") {
    const result = await db.query("SELECT id, slug, nama FROM tenants WHERE id = $1", [tenantOrId]);
    tenant = result.rows[0];
  }
  if (!tenant) {
    const error = new Error("Tenant tidak ditemukan");
    error.status = 404;
    throw error;
  }
  const hostname = buildTenantHostname(tenant.slug);
  const inserted = await db.query(
    `INSERT INTO tenant_domains (tenant_id, hostname, created_by, updated_by)
     VALUES ($1, $2, $3, $3)
     ON CONFLICT (hostname) DO NOTHING
     RETURNING *`,
    [tenant.id, hostname, platformUser?.id || null]
  );
  if (inserted.rows[0]) return inserted.rows[0];
  const existing = await db.query("SELECT * FROM tenant_domains WHERE hostname = $1", [hostname]);
  if (Number(existing.rows[0]?.tenant_id) !== Number(tenant.id)) {
    const error = new Error("Hostname sudah digunakan tenant lain");
    error.status = 409;
    throw error;
  }
  return existing.rows[0];
}

async function getTenantDomainByTenantId(tenantId, db = pool) {
  const { rows } = await db.query(
    `SELECT td.*, t.slug, t.nama AS tenant_nama
     FROM tenant_domains td JOIN tenants t ON t.id = td.tenant_id
     WHERE td.tenant_id = $1 AND td.is_primary = TRUE LIMIT 1`, [tenantId]
  );
  return rows[0] || null;
}

async function listTenantDomains(db = pool) {
  const { rows } = await db.query(
    `SELECT td.*, t.slug, t.nama AS tenant_nama, t.status AS tenant_status
     FROM tenants t LEFT JOIN tenant_domains td ON td.tenant_id = t.id AND td.is_primary = TRUE
     ORDER BY t.nama ASC`
  );
  return rows;
}

async function updateDomainStatuses(tenantId, patch, platformUser = null, db = pool) {
  const sets = [];
  const params = [];
  for (const [field, allowed] of Object.entries(STATUS_FIELDS)) {
    if (patch[field] == null) continue;
    if (!allowed.has(patch[field])) {
      const error = new Error(`Status ${field} tidak valid`);
      error.status = 400;
      throw error;
    }
    params.push(patch[field]);
    sets.push(`${field} = $${params.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "last_error")) {
    params.push(patch.last_error ? String(patch.last_error).slice(0, 2000) : null);
    sets.push(`last_error = $${params.length}`);
  }
  if (!sets.length) {
    const error = new Error("Tidak ada status yang diubah");
    error.status = 400;
    throw error;
  }
  params.push(platformUser?.id || null, tenantId);
  const activated = patch.overall_status === "active" ? "activated_at = COALESCE(activated_at, NOW())," : "";
  const { rows } = await db.query(
    `UPDATE tenant_domains SET ${sets.join(", ")}, ${activated}
       updated_by = $${params.length - 1}, updated_at = NOW()
     WHERE tenant_id = $${params.length} AND is_primary = TRUE RETURNING *`, params
  );
  if (!rows[0]) {
    const error = new Error("Draft domain tenant belum tersedia");
    error.status = 404;
    throw error;
  }
  return rows[0];
}

async function regenerateDraftDomain(tenantId, platformUser = null, db = pool) {
  const tenantResult = await db.query("SELECT id, slug, nama FROM tenants WHERE id = $1", [tenantId]);
  const tenant = tenantResult.rows[0];
  if (!tenant) {
    const error = new Error("Tenant tidak ditemukan"); error.status = 404; throw error;
  }
  const hostname = buildTenantHostname(tenant.slug);
  const { rows } = await db.query(
    `UPDATE tenant_domains SET hostname = $1, dns_status = 'pending', vercel_status = 'pending',
       ssl_status = 'pending', overall_status = 'draft', last_error = NULL, activated_at = NULL,
       updated_by = $2, updated_at = NOW()
     WHERE tenant_id = $3 AND is_primary = TRUE RETURNING *`,
    [hostname, platformUser?.id || null, tenant.id]
  );
  return rows[0] || createDraftDomainForTenant(tenant, platformUser, db);
}

module.exports = {
  RESERVED_SLUGS, buildTenantHostname, validateTenantHostname, ensureReservedSlug,
  createDraftDomainForTenant, getTenantDomainByTenantId, listTenantDomains,
  updateDomainStatuses, regenerateDraftDomain, checkHostnameAvailability,
};

