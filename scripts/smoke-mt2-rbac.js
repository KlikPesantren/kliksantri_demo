/**
 * Smoke test — MT-2 RBAC tenant hardening
 * Usage: node scripts/smoke-mt2-rbac.js
 * Requires: server running, tenant admin credentials
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const TENANT_SLUG = process.env.SMOKE_TENANT_A || "default";
const TENANT_USER = process.env.SMOKE_TENANT_USER || "superadmin";
const TENANT_PASS = process.env.SMOKE_TENANT_PASS || "123456";
const PLATFORM_USER = process.env.SMOKE_PLATFORM_USER || "platform";
const PLATFORM_PASS = process.env.SMOKE_PLATFORM_PASS || "123456";

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

async function loginTenant() {
  const { body } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: TENANT_USER,
      password: TENANT_PASS,
      tenant_slug: TENANT_SLUG,
    }),
  });
  if (!body.token) throw new Error(`Tenant login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function loginPlatform() {
  const { body } = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: PLATFORM_USER, password: PLATFORM_PASS }),
  });
  if (!body.token) throw new Error(`Platform login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function run() {
  console.log("\n=== MT-2 RBAC Tenant Hardening Smoke ===\n");

  const tenantToken = await loginTenant();
  const tenantHeaders = {
    Authorization: `Bearer ${tenantToken}`,
    "Content-Type": "application/json",
  };

  // 1. GET /roles — no platform_superadmin
  const rolesRes = await fetchJson("/roles", { headers: tenantHeaders });
  const roleNames = (rolesRes.body?.data || []).map((r) => r.name);
  if (rolesRes.res.status === 200 && !roleNames.includes("platform_superadmin")) {
    ok("GET /roles — tanpa platform_superadmin");
  } else {
    fail("GET /roles — tanpa platform_superadmin", roleNames);
  }

  if (rolesRes.body?.rbac_read_only === true) {
    ok("GET /roles — rbac_read_only true");
  } else {
    fail("GET /roles — rbac_read_only", rolesRes.body?.rbac_read_only);
  }

  // 2. POST /roles blocked
  const createRole = await fetchJson("/roles", {
    method: "POST",
    headers: tenantHeaders,
    body: JSON.stringify({ name: "custom_hacker", label: "Hacker" }),
  });
  if (createRole.res.status === 403) ok("POST /roles ditolak");
  else fail("POST /roles ditolak", createRole.res.status);

  // 3–5. PUT permissions & DELETE blocked
  const firstRoleId = rolesRes.body?.data?.[0]?.id;
  if (firstRoleId) {
    const putPerm = await fetchJson(`/roles/${firstRoleId}/permissions`, {
      method: "PUT",
      headers: tenantHeaders,
      body: JSON.stringify({ permissions: ["dashboard.view"] }),
    });
    if (putPerm.res.status === 403) ok("PUT /roles/:id/permissions ditolak");
    else fail("PUT /roles/:id/permissions", putPerm.res.status);

    const delRole = await fetchJson(`/roles/${firstRoleId}`, {
      method: "DELETE",
      headers: tenantHeaders,
    });
    if (delRole.res.status === 403) ok("DELETE /roles/:id ditolak");
    else fail("DELETE /roles/:id", delRole.res.status);
  } else {
    fail("Setup role id untuk mutation test", "no roles");
  }

  // 6. POST /users platform_superadmin
  const badPlatformUser = await fetchJson("/users", {
    method: "POST",
    headers: tenantHeaders,
    body: JSON.stringify({
      nama: "Bad",
      username: `bad_plat_${Date.now()}`,
      password: "123456",
      role: "platform_superadmin",
    }),
  });
  if (badPlatformUser.res.status === 403) ok("POST /users platform_superadmin ditolak");
  else fail("POST /users platform_superadmin", badPlatformUser.res.status);

  // 7. POST /users unknown role
  const badUnknown = await fetchJson("/users", {
    method: "POST",
    headers: tenantHeaders,
    body: JSON.stringify({
      nama: "Bad",
      username: `bad_unknown_${Date.now()}`,
      password: "123456",
      role: "role_tidak_ada",
    }),
  });
  if (badUnknown.res.status === 403) ok("POST /users role unknown ditolak");
  else fail("POST /users role unknown", badUnknown.res.status);

  // 8. POST /users keuangan (bendahara)
  const goodUser = await fetchJson("/users", {
    method: "POST",
    headers: tenantHeaders,
    body: JSON.stringify({
      nama: "Bendahara Test",
      username: `keuangan_mt2_${Date.now()}`,
      password: "123456",
      role: "keuangan",
    }),
  });
  if (goodUser.res.status === 200 && goodUser.body?.data?.role === "keuangan") {
    ok("POST /users role keuangan sukses");
    await pool.query("DELETE FROM users WHERE id = $1", [goodUser.body.data.id]).catch(() => {});
  } else {
    fail("POST /users role keuangan", goodUser.body);
  }

  // meta roles safe list
  const meta = await fetchJson("/users/meta/roles", { headers: tenantHeaders });
  const metaNames = (meta.body?.data || []).map((r) => r.name);
  if (!metaNames.includes("platform_superadmin") && metaNames.includes("keuangan")) {
    ok("GET /users/meta/roles — safe list");
  } else {
    fail("GET /users/meta/roles", metaNames);
  }

  // 9. Tenant cannot access platform
  const platformAsTenant = await fetchJson("/platform/tenants", { headers: tenantHeaders });
  if (platformAsTenant.res.status === 403 || platformAsTenant.res.status === 401) {
    ok("Tenant token tidak bisa akses /platform/tenants");
  } else {
    fail("Tenant token /platform/tenants", platformAsTenant.res.status);
  }

  // 10. Platform cannot access tenant routes
  try {
    const platformToken = await loginPlatform();
    const platformHeaders = { Authorization: `Bearer ${platformToken}` };
    const santriAsPlatform = await fetchJson("/santri", { headers: platformHeaders });
    if (santriAsPlatform.res.status === 403) {
      ok("Platform token tidak bisa akses /santri");
    } else {
      fail("Platform token /santri", santriAsPlatform.res.status);
    }
  } catch (err) {
    fail("Platform login for isolation test", err.message);
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
