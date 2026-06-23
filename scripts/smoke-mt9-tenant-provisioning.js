/**
 * Smoke test — MT-9 Tenant Provisioning UI / API
 * Usage: node scripts/smoke-mt9-tenant-provisioning.js
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const TEST_SLUG = "tenant-mt9-provision";
const ADMIN_USER = "admin.mt9provision";
const ADMIN_PASS = "Mt9SmokePass1";

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log("  PASS:", label);
}

function fail(label, detail) {
  failed++;
  console.error("  FAIL:", label, detail !== undefined ? detail : "");
}

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function cleanup() {
  const { rows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );
  if (!rows.length) return;
  const tid = rows[0].id;
  await pool.query(`DELETE FROM audit_logs WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM tenant_features WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM users WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM unit_pendidikan WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM profil_pesantren WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM tenants WHERE id = $1`, [tid]);
}

async function run() {
  console.log("=== Smoke: MT-9 Tenant Provisioning ===\n");

  try {
    await cleanup();

    const login = await fetchJson("/platform/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.SMOKE_PLATFORM_USER || "platform",
        password: process.env.SMOKE_PLATFORM_PASS || "123456",
      }),
    });
    if (!login.body?.token) {
      fail("platform login", login.body);
      return;
    }
    ok("platform login");

    const headers = {
      Authorization: `Bearer ${login.body.token}`,
      "Content-Type": "application/json",
    };

    const packages = await fetchJson("/platform/tenants/packages", { headers });
    if (packages.res.status === 200 && packages.body.packages?.length >= 4) {
      ok("GET /platform/tenants/packages");
    } else {
      fail("GET /platform/tenants/packages", packages.body);
    }

    const created = await fetchJson("/platform/tenants", {
      method: "POST",
      headers,
      body: JSON.stringify({
        nama: "Pesantren MT9 Provision",
        slug: TEST_SLUG,
        admin_nama: "Admin MT9",
        admin_username: ADMIN_USER,
        admin_password: ADMIN_PASS,
        package: "basic",
        create_default_unit_users: false,
      }),
    });

    if (created.res.status !== 201 || created.body.tenant?.slug !== TEST_SLUG) {
      fail("POST /platform/tenants basic package", created.body);
      return;
    }
    ok("POST /platform/tenants basic package");

    const tenantId = created.body.tenant_id;
    if (created.body.admin?.password === ADMIN_PASS) {
      ok("Response includes admin password once");
    } else {
      fail("Response admin password", created.body.admin);
    }

    const features = await fetchJson(`/platform/tenants/${tenantId}/features`, {
      headers,
    });
    const map = Object.fromEntries(
      (features.body.features || []).map((f) => [f.key, f.enabled])
    );
    if (map.santri && map.pembayaran && !map.rfid && !map.sahriyah) {
      ok("Basic package features applied");
    } else {
      fail("Basic package features", map);
    }

    const units = await pool.query(
      `SELECT COUNT(*)::int AS n FROM unit_pendidikan WHERE tenant_id = $1`,
      [tenantId]
    );
    if (units.rows[0].n === 7) ok("7 default units created");
    else fail("default units", units.rows[0]);

    const audit = await pool.query(
      `SELECT event_type FROM audit_logs WHERE tenant_id = $1 AND event_type = 'platform.tenant.created'`,
      [tenantId]
    );
    if (audit.rows.length >= 1) ok("Audit log platform.tenant.created");
    else fail("audit log");

    const tenantLogin = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: ADMIN_USER,
        password: ADMIN_PASS,
        tenant_slug: TEST_SLUG,
      }),
    });
    if (tenantLogin.res.status === 200 && tenantLogin.body.token) {
      ok("New tenant admin can login");
    } else {
      fail("tenant admin login", tenantLogin.body);
    }

    const dupSlug = await fetchJson("/platform/tenants", {
      method: "POST",
      headers,
      body: JSON.stringify({
        nama: "Dup",
        slug: TEST_SLUG,
        admin_username: "admin.dup",
        admin_password: ADMIN_PASS,
        package: "basic",
      }),
    });
    if (dupSlug.res.status === 409) ok("Duplicate slug rejected");
    else fail("duplicate slug", dupSlug.res.status);

    const { rows: preserved } = await pool.query(
      `SELECT slug, status FROM tenants WHERE slug IN ('default', 'al-hikmah') ORDER BY slug`
    );
    if (
      preserved.length === 2 &&
      preserved.every((t) => t.status === "active")
    ) {
      ok("default + al-hikmah preserved");
    } else {
      fail("existing tenants preserved", preserved);
    }

    await cleanup();
    ok("cleanup test tenant");
  } catch (err) {
    console.error(err);
    failed++;
  } finally {
    try {
      await pool.end();
    } catch (_) {
      /* ignore */
    }
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
