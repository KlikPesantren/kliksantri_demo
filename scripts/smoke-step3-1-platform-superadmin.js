/**
 * Smoke test — Step 3.1 Platform Superadmin Foundation
 * Usage: node scripts/smoke-step3-1-platform-superadmin.js
 */
require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3015";

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

async function fetchJson(urlPath, opts = {}) {
  const res = await fetch(`${BASE}${urlPath}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function run() {
  console.log("=== Smoke: Step 3.1 Platform Superadmin ===\n");

  try {
    execSync("node scripts/run-migration-035.js", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    ok("Run migration 035 OK");
  } catch {
    fail("Run migration 035 OK");
  }

  const platformLogin = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "platform", password: "123456" }),
  });
  if (
    platformLogin.res.status === 200 &&
    platformLogin.body.token &&
    platformLogin.body.user?.platform === true &&
    platformLogin.body.user?.role === "platform_superadmin"
  ) {
    ok("POST /platform/auth/login → 200");
  } else {
    fail("POST /platform/auth/login → 200", platformLogin.body);
  }

  const platformToken = platformLogin.body.token;
  const hPlatform = { Authorization: `Bearer ${platformToken}` };

  const platformMe = await fetchJson("/platform/auth/me", { headers: hPlatform });
  if (
    platformMe.res.status === 200 &&
    platformMe.body.user?.platform === true
  ) {
    ok("GET /platform/auth/me → 200");
  } else {
    fail("GET /platform/auth/me → 200", platformMe.body);
  }

  const platformTenants = await fetchJson("/platform/tenants", {
    headers: hPlatform,
  });
  if (
    platformTenants.res.status === 200 &&
    platformTenants.body.success === true
  ) {
    ok("GET /platform/tenants (platform token) → 200");
  } else {
    fail("GET /platform/tenants (platform token) → 200", platformTenants.body);
  }

  const tenantLogin = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: "admin123",
      tenant_slug: "default",
    }),
  });
  if (tenantLogin.res.status === 200 && tenantLogin.body.token) {
    ok("POST /auth/login tenant admin default → 200");
  } else {
    fail("POST /auth/login tenant admin default → 200", tenantLogin.body);
  }

  const tenantToken = tenantLogin.body.token;
  const hTenant = { Authorization: `Bearer ${tenantToken}` };

  const tenantPlatformTenants = await fetchJson("/platform/tenants", {
    headers: hTenant,
  });
  if (tenantPlatformTenants.res.status === 401 || tenantPlatformTenants.res.status === 403) {
    ok("Tenant admin token → /platform/tenants ditolak");
  } else {
    fail("Tenant admin token → /platform/tenants ditolak", tenantPlatformTenants.body);
  }

  const platformDashboard = await fetchJson("/dashboard/summary", {
    headers: hPlatform,
  });
  if (platformDashboard.res.status === 403) {
    ok("Platform token → /dashboard → 403");
  } else {
    fail("Platform token → /dashboard → 403", platformDashboard.body);
  }

  const platformSantri = await fetchJson("/santri", { headers: hPlatform });
  if (platformSantri.res.status === 403) {
    ok("Platform token → /santri → 403");
  } else {
    fail("Platform token → /santri → 403", platformSantri.body);
  }

  const platformViaTenantLogin = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "platform",
      password: "123456",
      tenant_slug: "default",
    }),
  });
  if (platformViaTenantLogin.res.status === 401 || platformViaTenantLogin.res.status === 403) {
    ok("Platform user login via /auth/login → gagal");
  } else {
    fail("Platform user login via /auth/login → gagal", platformViaTenantLogin.body);
  }

  const tenantViaPlatformLogin = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  if (tenantViaPlatformLogin.res.status === 401) {
    ok("Tenant user login via /platform/auth/login → gagal");
  } else {
    fail("Tenant user login via /platform/auth/login → gagal", tenantViaPlatformLogin.body);
  }

  console.log(`\n=== Result: ${passed}/10 passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
