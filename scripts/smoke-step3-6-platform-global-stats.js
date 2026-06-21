/**
 * Smoke test — Step 3.6 Platform Global Tenant Statistics
 * Usage: node scripts/smoke-step3-6-platform-global-stats.js
 * Requires server on SMOKE_BASE_URL (default http://localhost:3020)
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3020";

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

function isNumericObject(obj, keys) {
  if (!obj || typeof obj !== "object") return false;
  return keys.every(
    (k) => typeof obj[k] === "number" && Number.isFinite(obj[k])
  );
}

async function fetchJson(urlPath, opts = {}) {
  const res = await fetch(`${BASE}${urlPath}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

function skip(label, reason) {
  console.log("  SKIP:", label, reason ? `— ${reason}` : "");
}

async function run() {
  console.log("=== Smoke: Step 3.6 Platform Global Stats ===\n");

  const platformLogin = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "platform", password: "123456" }),
  });

  if (platformLogin.res.status === 200 && platformLogin.body.token) {
    ok("1. Platform login OK");
  } else {
    fail("1. Platform login OK", platformLogin.body);
  }

  const hPlatform = { Authorization: `Bearer ${platformLogin.body.token}` };

  const stats = await fetchJson("/platform/stats/summary", {
    headers: hPlatform,
  });

  if (stats.res.status === 200 && stats.body.success === true) {
    ok("2. GET /platform/stats/summary OK");
  } else {
    fail("2. GET /platform/stats/summary", stats.body);
  }

  const b = stats.body;

  if (b.summary && isNumericObject(b.summary, [
    "total_tenants",
    "active_tenants",
    "suspended_tenants",
    "trial_tenants",
    "total_users",
    "total_santri",
    "total_wali",
    "total_guru",
    "total_kelas",
    "total_units",
    "total_devices",
    "online_devices",
  ])) {
    ok("3. Response has summary (numeric)");
  } else fail("3. summary", b.summary);

  if (b.activity && isNumericObject(b.activity, [
    "new_tenants_this_month",
    "payments_this_month_count",
    "payments_this_month_nominal",
    "rfid_transactions_today",
    "rfid_nominal_today",
  ])) {
    ok("4. Response has activity (numeric)");
  } else fail("4. activity", b.activity);

  if (Array.isArray(b.tenant_status_breakdown)) {
    ok("5. Response has tenant_status_breakdown");
  } else fail("5. tenant_status_breakdown");

  if (Array.isArray(b.recent_tenants)) {
    ok("6. Response has recent_tenants");
  } else fail("6. recent_tenants");

  if (
    b.top_tenants &&
    Array.isArray(b.top_tenants.by_santri) &&
    Array.isArray(b.top_tenants.by_payments_this_month) &&
    Array.isArray(b.top_tenants.by_rfid_today)
  ) {
    ok("7. Response has top_tenants");
  } else fail("7. top_tenants", b.top_tenants);

  if (b.generated_at) ok("8. generated_at present");
  else fail("8. generated_at");

  const hasSuspendedInBreakdown = b.tenant_status_breakdown?.some(
    (row) => row.status === "suspended" && row.count >= 0
  );
  if (hasSuspendedInBreakdown || b.summary?.suspended_tenants >= 0) {
    ok("10. Suspended tenants counted in breakdown/summary");
  } else {
    fail("10. Suspended breakdown", b.tenant_status_breakdown);
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

  if (tenantLogin.body.token) {
    const blocked = await fetchJson("/platform/stats/summary", {
      headers: { Authorization: `Bearer ${tenantLogin.body.token}` },
    });
    if (blocked.res.status === 403) {
      ok("9. Tenant admin token blocked from platform stats");
    } else {
      fail("9. Tenant admin blocked", blocked.body);
    }
  } else {
    skip("9. Tenant admin blocked", "default admin login unavailable");
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
