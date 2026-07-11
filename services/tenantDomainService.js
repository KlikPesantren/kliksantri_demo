const pool = require("../db");
const cloudflareDnsService = require("./cloudflareDnsService");

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

async function writeDnsAudit(client, domain, actorUserId, eventType, outcome, detail = {}) {
  await client.query(
    `INSERT INTO audit_logs (device_id, event_type, detail, tenant_id)
     VALUES ($1, $2, $3, $4)`,
    [
      `platform:${actorUserId || "system"}`,
      eventType,
      JSON.stringify({ domain_id: domain.id, hostname: domain.hostname, outcome, actor_user_id: actorUserId || null, ...detail }),
      domain.tenant_id,
    ]
  );
}

function logCloudflareOperationError(operation, domain, error) {
  console.error("[cloudflare-dns-error]", {
    operation,
    domainId: domain.id,
    hostname: domain.hostname,
    cloudflareEndpoint: error.cloudflareEndpoint || null,
    providerHttpStatus: error.providerStatus ?? error.status ?? null,
    cloudflareErrorCodes: error.providerErrors || [],
    cloudflareErrorMessages: error.providerMessages || [],
    sanitizedResponseBody: error.sanitizedProviderBody || null,
    stack: error.stack || null,
  });
}

async function withLockedDomain(domainId, db, operation) {
  const client = await db.connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT td.*, t.slug, t.status AS tenant_status
       FROM tenant_domains td JOIN tenants t ON t.id = td.tenant_id
       WHERE td.id = $1 FOR UPDATE OF td`,
      [domainId]
    );
    const domain = rows[0];
    if (!domain) { const error = new Error("Domain tenant tidak ditemukan"); error.status = 404; throw error; }
    validateTenantHostname(domain.hostname);
    const result = await operation(client, domain);
    await client.query("COMMIT");
    committed = true;
    return result;
  } catch (error) {
    if (!committed) {
      try { await client.query("ROLLBACK"); } catch { /* rollback best effort */ }
    }
    throw error;
  } finally {
    client.release();
  }
}

async function setDnsState(client, domainId, state, actorUserId, metadata = {}) {
  const { rows } = await client.query(
    `UPDATE tenant_domains
     SET dns_status = $1,
         overall_status = CASE WHEN overall_status = 'disabled' THEN 'disabled' ELSE $2 END,
         last_error = $3,
         metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
         updated_by = $5,
         updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [state.dnsStatus, state.overallStatus, state.lastError || null, JSON.stringify(metadata), actorUserId || null, domainId]
  );
  return rows[0];
}

async function provisionDnsForTenantDomain(domainId, actorUserId, options = {}) {
  const db = options.db || pool;
  const dns = options.dnsService || cloudflareDnsService;
  const outcome = await withLockedDomain(domainId, db, async (client, domain) => {
    if (domain.overall_status === "disabled") {
      const error = new Error("Domain disabled tidak dapat diprovision"); error.status = 409; throw error;
    }
    if (domain.dns_status === "creating") {
      const error = new Error("Provisioning DNS sedang berjalan"); error.status = 409; throw error;
    }
    await setDnsState(client, domain.id, { dnsStatus: "creating", overallStatus: "provisioning" }, actorUserId);
    await writeDnsAudit(client, domain, actorUserId, "platform.tenant_domain.dns_provision_started", "started");
    try {
      const record = await dns.createTenantCname(domain.hostname);
      if (record.dryRun) {
        const updated = await setDnsState(client, domain.id, { dnsStatus: "pending", overallStatus: "draft" }, actorUserId, {
          cloudflare: { dry_run: true, target: dns.config.target, checked_at: new Date().toISOString() },
        });
        await writeDnsAudit(client, domain, actorUserId, "platform.tenant_domain.dns_provision_success", "dry_run");
        return { data: updated };
      }
      const updated = await setDnsState(client, domain.id, { dnsStatus: "active", overallStatus: domain.overall_status === "active" ? "active" : "provisioning" }, actorUserId, {
        cloudflare: { record_id: record.id, target: dns.config.target, dry_run: false, reconciled_at: new Date().toISOString() },
      });
      await writeDnsAudit(client, domain, actorUserId, "platform.tenant_domain.dns_provision_success", record.reused ? "reused" : "created");
      return { data: updated };
    } catch (error) {
      logCloudflareOperationError("provision", domain, error);
      const safeError = dns.normalizeCloudflareError(error);
      const updated = await setDnsState(client, domain.id, { dnsStatus: "failed", overallStatus: "failed", lastError: safeError }, actorUserId);
      await writeDnsAudit(client, domain, actorUserId, "platform.tenant_domain.dns_provision_failed", "failed", { error: safeError });
      return { data: updated, error: safeError, status: error.status || 502 };
    }
  });
  if (outcome.error) { const error = new Error(outcome.error); error.status = outcome.status; error.domain = outcome.data; throw error; }
  return outcome.data;
}

async function retryDnsProvisioning(domainId, actorUserId, options = {}) {
  return provisionDnsForTenantDomain(domainId, actorUserId, options);
}

async function rollbackDnsProvisioning(domainId, actorUserId, options = {}) {
  const db = options.db || pool;
  const dns = options.dnsService || cloudflareDnsService;
  const outcome = await withLockedDomain(domainId, db, async (client, domain) => {
    try {
      const result = await dns.deleteTenantDnsRecord(domain.hostname);
      const updated = await setDnsState(client, domain.id, { dnsStatus: "pending", overallStatus: "draft" }, actorUserId, {
        cloudflare: { dry_run: Boolean(result.dryRun), target: dns.config.target, record_id: null, rolled_back_at: new Date().toISOString() },
      });
      await writeDnsAudit(client, domain, actorUserId, "platform.tenant_domain.dns_rollback_success", result.dryRun ? "dry_run" : result.missing ? "already_missing" : "deleted");
      return { data: updated };
    } catch (error) {
      logCloudflareOperationError("rollback", domain, error);
      const safeError = dns.normalizeCloudflareError(error);
      const updated = await setDnsState(client, domain.id, { dnsStatus: "failed", overallStatus: "failed", lastError: safeError }, actorUserId);
      await writeDnsAudit(client, domain, actorUserId, "platform.tenant_domain.dns_rollback_failed", "failed", { error: safeError });
      return { data: updated, error: safeError, status: error.status || 502 };
    }
  });
  if (outcome.error) { const error = new Error(outcome.error); error.status = outcome.status; error.domain = outcome.data; throw error; }
  return outcome.data;
}

async function reconcileDnsStatus(domainId, actorUserId, options = {}) {
  const db = options.db || pool;
  const dns = options.dnsService || cloudflareDnsService;
  return withLockedDomain(domainId, db, async (client, domain) => {
    try {
      const verification = await dns.verifyTenantDnsRecord(domain.hostname);
      if (verification.dryRun) {
        return setDnsState(client, domain.id, { dnsStatus: "pending", overallStatus: "draft" }, actorUserId, {
          cloudflare: { dry_run: true, target: dns.config.target, checked_at: new Date().toISOString() },
        });
      }
      if (!verification.exists) {
        return setDnsState(client, domain.id, { dnsStatus: "failed", overallStatus: "failed", lastError: "Record DNS tenant tidak ditemukan" }, actorUserId);
      }
      if (!verification.matches) {
        return setDnsState(client, domain.id, { dnsStatus: "failed", overallStatus: "failed", lastError: "Record DNS sudah ada dengan target berbeda" }, actorUserId);
      }
      return setDnsState(client, domain.id, { dnsStatus: "active", overallStatus: domain.overall_status === "active" ? "active" : "provisioning" }, actorUserId, {
        cloudflare: { record_id: verification.record.id, target: dns.config.target, dry_run: false, reconciled_at: new Date().toISOString() },
      });
    } catch (error) {
      logCloudflareOperationError("reconcile", domain, error);
      const safeError = dns.normalizeCloudflareError(error);
      return setDnsState(client, domain.id, { dnsStatus: "failed", overallStatus: "failed", lastError: safeError }, actorUserId);
    }
  });
}

module.exports = {
  RESERVED_SLUGS, buildTenantHostname, validateTenantHostname, ensureReservedSlug,
  createDraftDomainForTenant, getTenantDomainByTenantId, listTenantDomains,
  updateDomainStatuses, regenerateDraftDomain, checkHostnameAvailability,
  provisionDnsForTenantDomain, retryDnsProvisioning, rollbackDnsProvisioning,
  reconcileDnsStatus,
};
