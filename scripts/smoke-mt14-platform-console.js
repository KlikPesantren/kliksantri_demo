/**
 * Smoke — MT-14 Platform Console
 * Usage: node scripts/smoke-mt14-platform-console.js
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://10.47.175.36:3000";

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

async function run() {
  console.log("=== Smoke: MT-14 Platform Console ===\n");

  try {
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
    const headers = { Authorization: `Bearer ${login.body.token}` };

    const dash = await fetchJson("/platform/stats/summary", { headers });
    if (dash.res.status === 200 && dash.body?.summary) ok("Platform dashboard API");
    else fail("Platform dashboard", dash.body);

    const tenants = await fetchJson("/platform/tenants", { headers });
    if (tenants.res.status === 200 && Array.isArray(tenants.body?.data)) {
      ok("Tenant list API");
    } else fail("Tenant list", tenants.body);

    const packages = await fetchJson("/platform/tenants/packages", { headers });
    if (packages.res.status === 200 && packages.body.packages?.length >= 4) {
      ok("Packages API");
    } else fail("Packages API", packages.body);

    const defaultRow = tenants.body.data.find((t) => t.slug === "default");
    const hikmahRow = tenants.body.data.find((t) => t.slug === "al-hikmah");
    if (defaultRow) ok("Tenant default exists");
    else fail("Tenant default");
    if (hikmahRow) ok("Tenant al-hikmah exists");
    else fail("Tenant al-hikmah");

    const detailId = defaultRow?.id || tenants.body.data[0]?.id;
    if (detailId) {
      const detail = await fetchJson(`/platform/tenants/${detailId}`, { headers });
      if (detail.res.status === 200) ok("Tenant detail API");
      else fail("Tenant detail", detail.body);

      const features = await fetchJson(`/platform/tenants/${detailId}/features`, {
        headers,
      });
      if (features.res.status === 200 && Array.isArray(features.body.features)) {
        ok("Feature management API");
      } else fail("Feature management", features.body);

      const billing = await fetchJson(`/platform/tenants/${detailId}/billing`, {
        headers,
      });
      if (billing.res.status === 200) ok("Billing API");
      else fail("Billing API", billing.body);

      const reset = await fetchJson(
        `/platform/tenants/${detailId}/reset-admin-password`,
        { method: "POST", headers }
      );
      if (reset.res.status === 200 && reset.body?.admin?.password) {
        ok("Reset admin password API");
      } else {
        fail("Reset admin password", reset.body);
      }
    }

    const createProbe = await fetchJson("/platform/tenants", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "Probe MT14",
        slug: "probe-mt14-should-fail-or-skip",
        admin_username: "admin.probe.mt14",
        admin_password: "ProbePass123",
        package: "basic",
        create_default_unit_users: false,
      }),
    });
    if (createProbe.res.status === 201 || createProbe.res.status === 409) {
      ok("Create tenant endpoint reachable");
      if (createProbe.res.status === 201) {
        const tid = createProbe.body.tenant_id;
        await pool.query(`DELETE FROM audit_logs WHERE tenant_id = $1`, [tid]);
        await pool.query(`DELETE FROM tenant_features WHERE tenant_id = $1`, [tid]);
        await pool.query(`DELETE FROM users WHERE tenant_id = $1`, [tid]);
        await pool.query(`DELETE FROM unit_pendidikan WHERE tenant_id = $1`, [tid]);
        await pool.query(`DELETE FROM profil_pesantren WHERE tenant_id = $1`, [tid]);
        await pool.query(`DELETE FROM tenants WHERE id = $1`, [tid]);
        ok("Probe tenant cleaned up");
      }
    } else {
      fail("Create tenant", createProbe.body);
    }
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
