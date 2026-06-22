/**
 * Smoke test — MT-1 P0 multi-tenant security fixes
 * Usage: node scripts/smoke-mt1-p0-security.js
 * Requires: server running, migration 043 applied, two test tenants optional
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const TENANT_A = process.env.SMOKE_TENANT_A || "default";
const TENANT_B = process.env.SMOKE_TENANT_B || "tenant-smoke-mt1-b";

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

async function loginTenant(username, password, tenantSlug) {
  const { res, body } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: tenantSlug }),
  });
  if (!body.token) {
    throw new Error(`Login failed ${username}@${tenantSlug}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function loginPlatform(username, password) {
  const { res, body } = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!body.token) {
    throw new Error(`Platform login failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function ensureTenantB() {
  const { rows: existing } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TENANT_B],
  );
  if (existing.length) return existing[0].id;

  const ins = await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Smoke MT1 Tenant B', 'active')
     RETURNING id`,
    [TENANT_B],
  );
  const tenantId = ins.rows[0].id;

  const hash = await bcrypt.hash("test123456", 10);
  await pool.query(
    `INSERT INTO users (nama, username, password, role, status, tenant_id)
     VALUES ('Admin B', 'admin_mt1_b', $1, 'superadmin', 'Aktif', $2)
     ON CONFLICT DO NOTHING`,
    [hash, tenantId],
  );

  await pool.query(
    `INSERT INTO audit_logs (device_id, event_type, detail, tenant_id)
     VALUES ('SMOKE', 'MT1_TEST', 'tenant B only', $1)`,
    [tenantId],
  );

  return tenantId;
}

async function run() {
  console.log("\n=== MT-1 P0 Security Smoke ===\n");
  console.log("BASE:", BASE);

  // 7. Public register blocked
  const reg = await fetchJson("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nama: "Hacker",
      username: "hacker",
      password: "123456",
      role: "superadmin",
    }),
  });
  if (reg.res.status === 403) ok("POST /auth/register ditolak (403)");
  else fail("POST /auth/register ditolak", reg.res.status);

  // 8. Platform login
  try {
    const platform = await loginPlatform("platform", "123456");
    if (platform.token) ok("Platform login OK");
    else fail("Platform login", platform);
  } catch (err) {
    fail("Platform login", err.message);
  }

  // 9. Tenant login
  let tokenA;
  try {
    const tenantLogin = await loginTenant("superadmin", "123456", TENANT_A);
    tokenA = tenantLogin.token;
    ok(`Tenant login OK (${TENANT_A})`);
  } catch (err) {
    fail("Tenant login", err.message);
    console.log("\nDone with errors — fix login credentials or server.\n");
    process.exit(1);
  }

  const headersA = {
    Authorization: `Bearer ${tokenA}`,
    "Content-Type": "application/json",
  };

  await ensureTenantB();
  let tokenB;
  try {
    const loginB = await loginTenant("admin_mt1_b", "test123456", TENANT_B);
    tokenB = loginB.token;
  } catch {
    fail("Setup tenant B login", "admin_mt1_b@test123456");
  }

  const headersB = tokenB
    ? { Authorization: `Bearer ${tokenB}`, "Content-Type": "application/json" }
    : null;

  // 1. /transaksi unauthenticated blocked
  const transaksiPublic = await fetchJson("/transaksi");
  if (transaksiPublic.res.status === 401) ok("GET /transaksi tanpa token → 401");
  else fail("GET /transaksi tanpa token", transaksiPublic.res.status);

  // 1b. Tenant A transaksi scoped
  const transaksiA = await fetchJson("/transaksi", { headers: headersA });
  if (transaksiA.res.status === 200 && Array.isArray(transaksiA.body)) {
    const leak = transaksiA.body.some(
      (row) => row.tenant_id && String(row.tenant_id) !== String(transaksiA.body[0]?.tenant_id),
    );
    if (!leak) ok("GET /transaksi tenant A — tidak bocor tenant lain");
    else fail("GET /transaksi tenant A leak", transaksiA.body.length);
  } else {
    fail("GET /transaksi tenant A", transaksiA.res.status);
  }

  if (headersB) {
    const transaksiB = await fetchJson("/transaksi", { headers: headersB });
    if (transaksiB.res.status === 200) {
      const idsA = new Set((transaksiA.body || []).map((r) => r.id));
      const overlap = (transaksiB.body || []).some((r) => idsA.has(r.id));
      if (!overlap) ok("GET /transaksi tenant B ≠ tenant A");
      else fail("GET /transaksi cross-tenant overlap");
    }
  }

  // 2. /audit scoped
  const auditPublic = await fetchJson("/audit");
  if (auditPublic.res.status === 401) ok("GET /audit tanpa token → 401");
  else fail("GET /audit tanpa token", auditPublic.res.status);

  const auditA = await fetchJson("/audit", { headers: headersA });
  if (auditA.res.status === 200 && auditA.body.success) {
    const rows = auditA.body.data || [];
    const bad = rows.some((r) => r.tenant_id && headersB && rows.length);
    ok("GET /audit tenant A OK");
  } else {
    fail("GET /audit tenant A", auditA.res.status);
  }

  if (headersB) {
    const auditB = await fetchJson("/audit", { headers: headersB });
    const bRows = auditB.body?.data || [];
    const aIds = new Set((auditA.body?.data || []).map((r) => r.id));
    const hasBOnly = bRows.some((r) => r.detail === "tenant B only");
    const noLeakFromA = !bRows.some((r) => aIds.has(r.id) && r.detail !== "tenant B only");
    if (hasBOnly && auditB.res.status === 200) ok("GET /audit tenant B — row tenant B visible");
    else fail("GET /audit tenant B", auditB.body);
  }

  // 3. /rfid/audit scoped
  const rfidAuditA = await fetchJson("/rfid/audit", { headers: headersA });
  if (rfidAuditA.res.status === 200) ok("GET /rfid/audit tenant A OK");
  else fail("GET /rfid/audit tenant A", rfidAuditA.res.status);

  // 4. roles meta no platform_superadmin
  const rolesMeta = await fetchJson("/users/meta/roles", { headers: headersA });
  const roleNames = (rolesMeta.body?.data || []).map((r) => r.name);
  if (!roleNames.includes("platform_superadmin")) {
    ok("GET /users/meta/roles — tanpa platform_superadmin");
  } else {
    fail("GET /users/meta/roles — platform_superadmin masih muncul", roleNames);
  }

  // 5. create user platform_superadmin blocked
  const createPlatformUser = await fetchJson("/users", {
    method: "POST",
    headers: headersA,
    body: JSON.stringify({
      nama: "Bad",
      username: `bad_platform_${Date.now()}`,
      password: "123456",
      role: "platform_superadmin",
    }),
  });
  if (createPlatformUser.res.status === 403) {
    ok("POST /users role platform_superadmin ditolak");
  } else {
    fail("POST /users role platform_superadmin", createPlatformUser.res.status);
  }

  // 6. mutate platform role permissions blocked
  const { rows: platformRole } = await pool.query(
    `SELECT id FROM roles WHERE name = 'platform_superadmin'`,
  );
  if (platformRole.length) {
    const mut = await fetchJson(`/roles/${platformRole[0].id}/permissions`, {
      method: "PUT",
      headers: headersA,
      body: JSON.stringify({ permissions: ["dashboard.view"] }),
    });
    if (mut.res.status === 403) ok("PUT /roles/:id/permissions platform role ditolak");
    else fail("PUT platform role permissions", mut.res.status);
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
