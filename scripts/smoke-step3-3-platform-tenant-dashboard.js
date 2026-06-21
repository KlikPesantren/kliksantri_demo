/**
 * Smoke test — Step 3.2.1 Security Hotfix + Step 3.3 Platform Tenant Dashboard
 * Usage: node scripts/smoke-step3-3-platform-tenant-dashboard.js
 * Requires server on SMOKE_BASE_URL (default http://localhost:3017)
 */
require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3017";
const TEST_SLUG_A = "tenant-smoke-3b3-a";
const TEST_SLUG_B = "tenant-smoke-3b3-b";
const ADMIN_A = "admin_smoke_3b3_a";
const ADMIN_B = "admin_smoke_3b3_b";
const ADMIN_PASS = "test123456";

let passed = 0;
let failed = 0;
let tenantIdA = null;
let tenantIdB = null;

function ok(label) {
  passed++;
  console.log("  PASS:", label);
}

function fail(label, detail) {
  failed++;
  console.error("  FAIL:", label, detail !== undefined ? detail : "");
}

function isNumericObject(obj) {
  if (obj === null || typeof obj !== "object") return false;
  return Object.values(obj).every(
    (v) => typeof v === "number" && Number.isFinite(v)
  );
}

async function fetchJson(urlPath, opts = {}) {
  const res = await fetch(`${BASE}${urlPath}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function cleanupTestTenant(slug) {
  const { rows } = await pool.query(`SELECT id FROM tenants WHERE slug = $1`, [
    slug,
  ]);
  if (!rows.length) return;
  const tid = rows[0].id;
  await pool.query(
    `DELETE FROM user_unit_scope s
     USING users u
     WHERE s.user_id = u.id AND u.tenant_id = $1`,
    [tid]
  );
  await pool.query(`DELETE FROM users WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM unit_pendidikan WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM profil_pesantren WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM santri WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM tenants WHERE id = $1`, [tid]);
}

async function createTestTenant(platformHeaders, slug, adminUser, nama) {
  const created = await fetchJson("/platform/tenants", {
    method: "POST",
    headers: { ...platformHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      nama_pesantren: nama,
      slug,
      alamat: "Jl. Smoke 3.3",
      telepon: "08111111111",
      admin_nama: `Admin ${slug}`,
      admin_username: adminUser,
      admin_password: ADMIN_PASS,
      create_default_unit_users: false,
    }),
  });
  return created;
}

async function run() {
  console.log("=== Smoke: Step 3.2.1 + 3.3 Platform Tenant Dashboard ===\n");

  try {
    execSync("node scripts/run-migration-037.js", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    ok("1. Migration 037 OK");
  } catch {
    fail("1. Migration 037 OK");
  }

  const legacyStats = await fetchJson("/transaksi/dashboard/stats");
  if (legacyStats.res.status === 410) {
    ok("2. GET /transaksi/dashboard/stats → 410 Gone");
  } else {
    fail("2. Legacy transaksi stats disabled", legacyStats.body);
  }

  const platformLogin = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "platform", password: "123456" }),
  });
  if (platformLogin.res.status === 200 && platformLogin.body.token) {
    ok("3. Platform login OK");
  } else {
    fail("3. Platform login OK", platformLogin.body);
  }

  const hPlatform = { Authorization: `Bearer ${platformLogin.body.token}` };

  const list = await fetchJson("/platform/tenants", { headers: hPlatform });
  if (list.res.status === 200 && Array.isArray(list.body.data)) {
    ok("4. GET /platform/tenants list OK");
  } else {
    fail("4. GET /platform/tenants list OK", list.body);
  }

  await cleanupTestTenant(TEST_SLUG_A);
  await cleanupTestTenant(TEST_SLUG_B);

  const createdA = await createTestTenant(
    hPlatform,
    TEST_SLUG_A,
    ADMIN_A,
    "Pesantren Smoke A"
  );
  if (createdA.res.status === 201) {
    ok("5. Create tenant A OK");
    tenantIdA = createdA.body.data?.tenant?.id;
  } else fail("5. Create tenant A OK", createdA.body);

  const createdB = await createTestTenant(
    hPlatform,
    TEST_SLUG_B,
    ADMIN_B,
    "Pesantren Smoke B"
  );
  if (createdB.res.status === 201) {
    ok("6. Create tenant B OK");
    tenantIdB = createdB.body.data?.tenant?.id;
  } else fail("6. Create tenant B OK", createdB.body);

  if (tenantIdA) {
    await pool.query(
      `INSERT INTO santri (nis, nama, status, tenant_id)
       VALUES ('SM3A001', 'Santri A', 'aktif', $1)`,
      [tenantIdA]
    );
  }
  if (tenantIdB) {
    await pool.query(
      `INSERT INTO santri (nis, nama, status, tenant_id)
       VALUES ('SM3B001', 'Santri B', 'aktif', $1),
              ('SM3B002', 'Santri B2', 'aktif', $1)`,
      [tenantIdB]
    );
  }

  const dashA = await fetchJson(`/platform/tenants/${tenantIdA}/dashboard`, {
    headers: hPlatform,
  });
  const dashB = await fetchJson(`/platform/tenants/${tenantIdB}/dashboard`, {
    headers: hPlatform,
  });

  if (dashA.res.status === 200 && dashA.body.success === true) {
    ok("7. GET /platform/tenants/:id/dashboard tenant A → 200");
  } else fail("7. Dashboard tenant A", dashA.body);

  const groups = [
    "tenant",
    "operasional",
    "keuangan",
    "pendidikan",
    "keamanan",
    "rfid",
  ];
  const allGroups =
    dashA.body.success &&
    groups.every((g) => dashA.body[g] != null) &&
    dashA.body.generated_at;
  if (allGroups) ok("8. Response groups complete");
  else fail("8. Response groups complete", dashA.body);

  const numericOk =
    isNumericObject(dashA.body.operasional) &&
    isNumericObject(dashA.body.keuangan) &&
    isNumericObject(dashA.body.pendidikan) &&
    isNumericObject(dashA.body.keamanan) &&
    isNumericObject(dashA.body.rfid);
  if (numericOk) ok("9. All metric values numeric");
  else fail("9. All metric values numeric", dashA.body);

  const isolated =
    dashB.res.status === 200 &&
    dashA.body.tenant?.id !== dashB.body.tenant?.id &&
    dashA.body.operasional?.total_santri !==
      dashB.body.operasional?.total_santri;
  if (isolated) ok("10. Tenant A ≠ tenant B stats (isolation)");
  else fail("10. Tenant isolation", {
    a: dashA.body.operasional,
    b: dashB.body.operasional,
  });

  const suspend = await fetchJson(`/platform/tenants/${tenantIdA}/status`, {
    method: "PATCH",
    headers: { ...hPlatform, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "suspended", reason: "smoke test" }),
  });
  if (suspend.res.status === 200) ok("11. Suspend tenant A OK");
  else fail("11. Suspend tenant A OK", suspend.body);

  const dashSuspended = await fetchJson(
    `/platform/tenants/${tenantIdA}/dashboard`,
    { headers: hPlatform }
  );
  if (
    dashSuspended.res.status === 200 &&
    dashSuspended.body.tenant?.status === "suspended"
  ) {
    ok("12. Suspended tenant readable by platform dashboard");
  } else fail("12. Suspended tenant dashboard", dashSuspended.body);

  const tenantLogin = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: ADMIN_B,
      password: ADMIN_PASS,
      tenant_slug: TEST_SLUG_B,
    }),
  });
  if (tenantLogin.res.status === 200 && tenantLogin.body.token) {
    ok("13. Tenant admin login B OK");
  } else fail("13. Tenant admin login B OK", tenantLogin.body);

  const tenantBlocked = await fetchJson(
    `/platform/tenants/${tenantIdB}/dashboard`,
    { headers: { Authorization: `Bearer ${tenantLogin.body.token}` } }
  );
  if (tenantBlocked.res.status === 403) {
    ok("14. Tenant user blocked from platform dashboard");
  } else fail("14. Tenant user platform dashboard", tenantBlocked.body);

  const profil = await fetchJson("/profil-pesantren", {
    headers: { Authorization: `Bearer ${tenantLogin.body.token}` },
  });
  if (
    profil.res.status === 200 &&
    profil.body.data?.tenant_id === tenantIdB
  ) {
    ok("15. GET /profil-pesantren tenant-scoped OK");
  } else fail("15. Profil pesantren tenant scoped", profil.body);

  await fetchJson(`/platform/tenants/${tenantIdA}/status`, {
    method: "PATCH",
    headers: { ...hPlatform, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "active" }),
  });

  await cleanupTestTenant(TEST_SLUG_A);
  await cleanupTestTenant(TEST_SLUG_B);

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
