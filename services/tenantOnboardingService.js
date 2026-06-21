const bcrypt = require("bcryptjs");
const pool = require("../db");

const RESERVED_SLUGS = new Set([
  "default",
  "platform",
  "admin",
  "api",
  "www",
  "root",
  "system",
]);

const SLUG_PATTERN = /^[a-z0-9-]+$/;

const DEFAULT_UNITS = [
  { kode: "PAUD", nama: "PAUD", sort_order: 1 },
  { kode: "TK", nama: "TK", sort_order: 2 },
  { kode: "SD", nama: "SD", sort_order: 3 },
  { kode: "MI", nama: "MI", sort_order: 4 },
  { kode: "SMP", nama: "SMP", sort_order: 5 },
  { kode: "SMA", nama: "SMA", sort_order: 6 },
  { kode: "MADINAH", nama: "MADINAH", sort_order: 7 },
];

const DEFAULT_UNIT_USERS = [
  { username: "pimpinan", role: "pimpinan_yayasan", unitKode: null },
  { username: "paud", role: "bendahara_unit", unitKode: "PAUD" },
  { username: "tk", role: "bendahara_unit", unitKode: "TK" },
  { username: "sd", role: "bendahara_unit", unitKode: "SD" },
  { username: "mi", role: "bendahara_unit", unitKode: "MI" },
  { username: "smp", role: "bendahara_unit", unitKode: "SMP" },
  { username: "sma", role: "bendahara_unit", unitKode: "SMA" },
  { username: "madinah", role: "bendahara_unit", unitKode: "MADINAH" },
];

const DEFAULT_UNIT_PASSWORD = "123456";

function validateSlug(slug) {
  const normalized = String(slug || "").trim().toLowerCase();

  if (!normalized || normalized.length < 3) {
    return { ok: false, error: "Slug minimal 3 karakter", status: 400 };
  }

  if (!SLUG_PATTERN.test(normalized)) {
    return {
      ok: false,
      error: "Slug hanya boleh huruf kecil, angka, dan dash",
      status: 400,
    };
  }

  if (RESERVED_SLUGS.has(normalized)) {
    return { ok: false, error: "Slug tidak tersedia (reserved)", status: 400 };
  }

  return { ok: true, slug: normalized };
}

function sanitizeUser(row) {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
}

async function createTenantWithDefaults(payload, platformUser) {
  const {
    nama_pesantren,
    slug,
    alamat,
    telepon,
    logo_url,
    admin_nama,
    admin_username,
    admin_password,
    create_default_unit_users = true,
  } = payload;

  if (!nama_pesantren?.trim()) {
    const err = new Error("nama_pesantren wajib diisi");
    err.status = 400;
    throw err;
  }

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) {
    const err = new Error(slugCheck.error);
    err.status = slugCheck.status;
    throw err;
  }

  if (!admin_username?.trim()) {
    const err = new Error("admin_username wajib diisi");
    err.status = 400;
    throw err;
  }

  if (!admin_password || String(admin_password).length < 6) {
    const err = new Error("admin_password minimal 6 karakter");
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingSlug = await client.query(
      `SELECT id FROM tenants WHERE slug = $1`,
      [slugCheck.slug]
    );
    if (existingSlug.rows.length > 0) {
      const err = new Error("Slug sudah digunakan");
      err.status = 409;
      throw err;
    }

    const tenantResult = await client.query(
      `INSERT INTO tenants (
         slug, nama, status, alamat, telepon, logo_url,
         onboarded_at, created_by
       )
       VALUES ($1, $2, 'active', $3, $4, $5, NOW(), $6)
       RETURNING *`,
      [
        slugCheck.slug,
        nama_pesantren.trim(),
        alamat?.trim() || null,
        telepon?.trim() || null,
        logo_url ?? null,
        platformUser?.id ?? null,
      ]
    );
    const tenant = tenantResult.rows[0];

    await client.query(
      `INSERT INTO profil_pesantren (
         nama_pesantren, alamat, telepon, logo_url, tenant_id, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        nama_pesantren.trim(),
        alamat?.trim() || null,
        telepon?.trim() || null,
        logo_url ?? null,
        tenant.id,
      ]
    );

    const units = [];
    const unitByKode = {};

    for (const unit of DEFAULT_UNITS) {
      const ins = await client.query(
        `INSERT INTO unit_pendidikan (kode, nama, sort_order, is_active, tenant_id)
         VALUES ($1, $2, $3, true, $4)
         RETURNING id, kode, nama, sort_order, tenant_id`,
        [unit.kode, unit.nama, unit.sort_order, tenant.id]
      );
      units.push(ins.rows[0]);
      unitByKode[unit.kode] = ins.rows[0].id;
    }

    const adminHash = await bcrypt.hash(admin_password, 10);
    const adminResult = await client.query(
      `INSERT INTO users (nama, username, password, role, status, tenant_id)
       VALUES ($1, $2, $3, 'superadmin', 'Aktif', $4)
       RETURNING id, nama, username, role, status, tenant_id, created_at`,
      [
        admin_nama?.trim() || "Admin Pesantren",
        admin_username.trim(),
        adminHash,
        tenant.id,
      ]
    );
    const admin_user = adminResult.rows[0];

    const default_users_created = [];

    if (create_default_unit_users) {
      const unitPasswordHash = await bcrypt.hash(DEFAULT_UNIT_PASSWORD, 10);

      for (const spec of DEFAULT_UNIT_USERS) {
        const userResult = await client.query(
          `INSERT INTO users (nama, username, password, role, status, tenant_id)
           VALUES ($1, $2, $3, $4, 'Aktif', $5)
           RETURNING id, nama, username, role, status, tenant_id, created_at`,
          [
            spec.username.charAt(0).toUpperCase() + spec.username.slice(1),
            spec.username,
            unitPasswordHash,
            spec.role,
            tenant.id,
          ]
        );

        const created = sanitizeUser(userResult.rows[0]);

        if (spec.unitKode && unitByKode[spec.unitKode]) {
          await client.query(
            `INSERT INTO user_unit_scope (user_id, unit_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [created.id, unitByKode[spec.unitKode]]
          );
          created.unit_kode = spec.unitKode;
        }

        default_users_created.push(created);
      }
    }

    await client.query("COMMIT");

    return {
      tenant,
      admin_user: sanitizeUser(admin_user),
      units,
      default_users_created,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      const dup = new Error("Slug atau username sudah digunakan");
      dup.status = 409;
      throw dup;
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  RESERVED_SLUGS,
  DEFAULT_UNITS,
  DEFAULT_UNIT_USERS,
  validateSlug,
  createTenantWithDefaults,
};
