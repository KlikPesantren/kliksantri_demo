const pool = require("../db");

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TENANT_STATUSES = new Set(["active", "suspended", "inactive"]);

function normalizeOptionalString(value) {
  if (value == null) return null;
  const str = String(value).trim();
  return str || null;
}

function normalizeTenantSlug(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || null;
}

function assertValidSlug(slug) {
  if (!slug) {
    const err = new Error("Slug tenant wajib diisi");
    err.status = 400;
    throw err;
  }
  if (slug.length < 2 || slug.length > 80) {
    const err = new Error("Slug harus 2–80 karakter");
    err.status = 400;
    throw err;
  }
  if (!SLUG_PATTERN.test(slug)) {
    const err = new Error(
      "Slug harus lowercase kebab-case (huruf, angka, dan tanda minus)"
    );
    err.status = 400;
    throw err;
  }
}

async function getTenantRowById(tenantId) {
  const { rows } = await pool.query(
    `SELECT id, slug, nama, status, alamat, telepon, logo_url, tagline
     FROM tenants
     WHERE id = $1`,
    [tenantId]
  );
  return rows[0] || null;
}

async function assertSlugAvailable(slug, tenantId) {
  const { rows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1 AND id <> $2 LIMIT 1`,
    [slug, tenantId]
  );
  if (rows.length > 0) {
    const err = new Error("Slug tenant sudah dipakai");
    err.status = 409;
    throw err;
  }
}

async function syncProfilPesantren(tenantId, patch) {
  const { nama, alamat, telepon, logo_url } = patch;
  if (!nama && !alamat && !telepon && logo_url === undefined) return;

  await pool.query(
    `UPDATE profil_pesantren
     SET
       nama_pesantren = COALESCE($1, nama_pesantren),
       alamat = COALESCE($2, alamat),
       telepon = COALESCE($3, telepon),
       logo_url = COALESCE($4, logo_url),
       updated_at = NOW()
     WHERE tenant_id = $5`,
    [nama, alamat, telepon, logo_url ?? null, tenantId]
  );
}

async function updateTenantFromPlatform(tenantId, patch = {}) {
  const existing = await getTenantRowById(tenantId);
  if (!existing) {
    const err = new Error("Tenant tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const updates = {};
  const params = [];
  const setClauses = [];
  let i = 1;

  if (patch.nama !== undefined) {
    const nama = normalizeOptionalString(patch.nama);
    if (!nama) {
      const err = new Error("Nama tenant wajib diisi");
      err.status = 400;
      throw err;
    }
    updates.nama = nama;
    setClauses.push(`nama = $${i++}`);
    params.push(nama);
  }

  if (patch.alamat !== undefined) {
    updates.alamat = normalizeOptionalString(patch.alamat);
    setClauses.push(`alamat = $${i++}`);
    params.push(updates.alamat);
  }

  if (patch.telepon !== undefined) {
    updates.telepon = normalizeOptionalString(patch.telepon);
    setClauses.push(`telepon = $${i++}`);
    params.push(updates.telepon);
  }

  if (patch.logo_url !== undefined) {
    updates.logo_url = patch.logo_url ?? null;
    setClauses.push(`logo_url = $${i++}`);
    params.push(updates.logo_url);
  }

  if (patch.tagline !== undefined) {
    updates.tagline = normalizeOptionalString(patch.tagline);
    setClauses.push(`tagline = $${i++}`);
    params.push(updates.tagline);
  }

  if (patch.slug !== undefined) {
    const nextSlug = normalizeTenantSlug(patch.slug);
    assertValidSlug(nextSlug);

    if (nextSlug !== existing.slug) {
      if (existing.slug === "default" && !patch.confirm_default_slug_change) {
        const err = new Error(
          "Mengubah slug tenant default memerlukan konfirmasi khusus"
        );
        err.status = 400;
        err.code = "DEFAULT_SLUG_CHANGE_REQUIRES_CONFIRM";
        throw err;
      }
      await assertSlugAvailable(nextSlug, tenantId);
      updates.slug = nextSlug;
      setClauses.push(`slug = $${i++}`);
      params.push(nextSlug);
    }
  }

  if (patch.status !== undefined) {
    const status = normalizeOptionalString(patch.status);
    if (!TENANT_STATUSES.has(status)) {
      const err = new Error("Status harus active, suspended, atau inactive");
      err.status = 400;
      throw err;
    }
    updates.status = status;
    setClauses.push(`status = $${i++}`);
    params.push(status);

    if (status === "active") {
      setClauses.push("suspended_at = NULL");
      setClauses.push("suspended_reason = NULL");
    } else {
      setClauses.push(`suspended_at = COALESCE(suspended_at, NOW())`);
      const reason =
        normalizeOptionalString(patch.suspended_reason) ||
        normalizeOptionalString(patch.reason) ||
        "Diubah dari platform console";
      setClauses.push(`suspended_reason = $${i++}`);
      params.push(reason);
    }
  }

  if (setClauses.length === 0) {
    return existing;
  }

  setClauses.push("updated_at = NOW()");
  params.push(tenantId);

  const { rows } = await pool.query(
    `UPDATE tenants
     SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    params
  );

  const tenant = rows[0];
  await syncProfilPesantren(tenant.id, updates);
  return tenant;
}

module.exports = {
  normalizeTenantSlug,
  updateTenantFromPlatform,
};
