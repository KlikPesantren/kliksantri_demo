/**
 * Smoke test — MT-7 Tenant Feature Management
 * Usage: node scripts/smoke-mt7-tenant-features.js
 * Requires: migration 044 applied, server optional for API tests
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
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

async function runDbChecks() {
  console.log("\n=== DB checks ===\n");

  const { rows: catalog } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM feature_catalog`
  );
  if (catalog[0].n >= 20) ok("feature_catalog seeded");
  else fail("feature_catalog seeded", catalog[0].n);

  const { rows: defaultRows } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE tf.enabled = true)::int AS enabled
     FROM tenant_features tf
     JOIN tenants t ON t.id = tf.tenant_id
     WHERE t.slug = 'default'`
  );
  if (defaultRows[0].total >= 20 && defaultRows[0].enabled >= 20) {
    ok("default tenant all features enabled");
  } else {
    fail("default tenant all features enabled", defaultRows[0]);
  }

  const { rows: core } = await pool.query(
    `SELECT key FROM feature_catalog WHERE is_core = true ORDER BY key`
  );
  const coreKeys = core.map((r) => r.key).sort();
  if (JSON.stringify(coreKeys) === JSON.stringify(["dashboard", "profil", "sistem"])) {
    ok("core features defined");
  } else {
    fail("core features defined", coreKeys);
  }
}

async function runApiChecks() {
  console.log("\n=== API checks ===\n");

  const login = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: PLATFORM_USER, password: PLATFORM_PASS }),
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

  const tenants = await fetchJson("/platform/tenants", { headers });
  const tenantSlug = process.env.SMOKE_TENANT_A || "default";
  const tenantRow =
    tenants.body?.data?.find((t) => t.slug === tenantSlug) ||
    tenants.body?.data?.[0];
  const tenantId = tenantRow?.id;
  if (!tenantId) {
    fail("GET /platform/tenants", tenants.body);
    return;
  }
  ok(`GET /platform/tenants (${tenantSlug} id=${tenantId})`);

  const features = await fetchJson(`/platform/tenants/${tenantId}/features`, {
    headers,
  });
  if (
    features.res.status === 200 &&
    Array.isArray(features.body?.features) &&
    features.body.features.length >= 20
  ) {
    ok("GET /platform/tenants/:id/features");
  } else {
    fail("GET /platform/tenants/:id/features", features.body);
    return;
  }

  const rfid = features.body.features.find((f) => f.key === "rfid");
  if (!rfid) {
    fail("rfid feature in list");
    return;
  }

  const patchOff = await fetchJson(`/platform/tenants/${tenantId}/features`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      features: [{ key: "rfid", enabled: false }],
    }),
  });
  if (patchOff.res.status === 200 && patchOff.body.features.find((f) => f.key === "rfid")?.enabled === false) {
    ok("PATCH disable rfid");
  } else {
    fail("PATCH disable rfid", patchOff.body);
  }

  const tenantLogin = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.SMOKE_TENANT_USER || "admin",
      password: process.env.SMOKE_TENANT_PASS || "admin123",
      tenant_slug: tenantSlug,
    }),
  });

  if (Array.isArray(tenantLogin.body?.user?.tenant_features)) {
  const hasRfid = tenantLogin.body.user.tenant_features.includes("rfid");
    if (!hasRfid) ok("tenant login tenant_features excludes rfid");
    else fail("tenant login tenant_features excludes rfid", tenantLogin.body.user.tenant_features);
  } else {
    fail("tenant login includes tenant_features", tenantLogin.body);
  }

  const rfidApi = await fetchJson("/rfid/dashboard", {
    headers: { Authorization: `Bearer ${tenantLogin.body?.token}` },
  });
  if (rfidApi.res.status === 403 && rfidApi.body?.code === "FEATURE_DISABLED") {
    ok("GET /rfid/dashboard blocked when rfid off");
  } else {
    fail("GET /rfid/dashboard blocked when rfid off", rfidApi.res.status);
  }

  const patchOn = await fetchJson(`/platform/tenants/${tenantId}/features`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      features: [{ key: "rfid", enabled: true }],
    }),
  });
  if (patchOn.res.status === 200) ok("PATCH re-enable rfid");
  else fail("PATCH re-enable rfid", patchOn.body);

  const patchCore = await fetchJson(`/platform/tenants/${tenantId}/features`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      features: [{ key: "dashboard", enabled: false }],
    }),
  });
  if (patchCore.res.status === 400) ok("PATCH core feature rejected");
  else fail("PATCH core feature rejected", patchCore.res.status);
}

async function run() {
  console.log("=== Smoke: MT-7 Tenant Feature Management ===");

  try {
    await runDbChecks();
    await runApiChecks();
  } catch (err) {
    console.error(err);
    failed++;
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  try {
    await pool.end();
  } catch (_) {
    /* ignore pool shutdown on Windows */
  }
  process.exit(failed > 0 ? 1 : 0);
}

run();
