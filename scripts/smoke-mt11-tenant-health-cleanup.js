/**
 * Smoke test - MT-11 Tenant Monitoring & Health + Safe Tenant Cleanup
 * Usage: node scripts/smoke-mt11-tenant-health-cleanup.js
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const SUFFIX = Date.now().toString(36);
const TEST_SLUG = `tenant-mt11-${SUFFIX}`;
const ADMIN_USER = `admin.mt11.${SUFFIX}`;
const ADMIN_PASS = "Mt11SmokePass1";

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

async function snapshotExistingTenants() {
  const { rows } = await pool.query(
    `SELECT t.slug, t.status, COUNT(tf.feature_key)::int AS feature_count
     FROM tenants t
     LEFT JOIN tenant_features tf ON tf.tenant_id = t.id
     WHERE t.slug IN ('default', 'al-hikmah')
     GROUP BY t.slug, t.status
     ORDER BY t.slug`
  );
  return rows;
}

function sameSnapshot(before, after) {
  return JSON.stringify(before) === JSON.stringify(after);
}

async function run() {
  console.log("=== Smoke: MT-11 Tenant Health + Safe Cleanup ===\n");

  const existingBefore = await snapshotExistingTenants();

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

    const headers = {
      Authorization: `Bearer ${login.body.token}`,
      "Content-Type": "application/json",
    };

    const created = await fetchJson("/platform/tenants", {
      method: "POST",
      headers,
      body: JSON.stringify({
        nama: "Pesantren MT11 Cleanup",
        slug: TEST_SLUG,
        admin_nama: "Admin MT11",
        admin_username: ADMIN_USER,
        admin_password: ADMIN_PASS,
        package: "basic",
        create_default_unit_users: false,
      }),
    });

    if (created.res.status !== 201 || created.body.tenant?.slug !== TEST_SLUG) {
      fail("Create dummy tenant", created.body);
      return;
    }
    ok("Create dummy tenant");

    const tenantId = created.body.tenant_id;

    const detail = await fetchJson(`/platform/tenants/${tenantId}`, { headers });
    if (
      detail.res.status === 200 &&
      detail.body.data?.health &&
      Number.isInteger(detail.body.data.health.total_user) &&
      detail.body.data.health.feature_status?.rfid === false
    ) {
      ok("Tenant detail includes health");
    } else {
      fail("Tenant detail includes health", detail.body);
    }

    const dashboard = await fetchJson(`/platform/tenants/${tenantId}/dashboard`, {
      headers,
    });
    if (dashboard.res.status === 200 && dashboard.body.health?.total_kelas >= 0) {
      ok("Tenant dashboard includes additive health");
    } else {
      fail("Tenant dashboard includes additive health", dashboard.body);
    }

    const list = await fetchJson(`/platform/tenants?q=${TEST_SLUG}`, { headers });
    const listed = list.body.data?.find((tenant) => tenant.slug === TEST_SLUG);
    if (
      list.res.status === 200 &&
      listed?.current_package?.id === "basic" &&
      Number.isInteger(listed.feature_enabled_count) &&
      Number.isInteger(listed.santri_count)
    ) {
      ok("Tenant list includes health summary");
    } else {
      fail("Tenant list includes health summary", list.body);
    }

    const features = await fetchJson(`/platform/tenants/${tenantId}/features`, {
      headers,
    });
    if (features.body.current_package?.id === "basic") {
      ok("Feature/package still works");
    } else {
      fail("Feature/package still works", features.body);
    }

    const defaultList = await fetchJson("/platform/tenants?q=default", { headers });
    const defaultTenant = defaultList.body.data?.find((tenant) => tenant.slug === "default");
    if (defaultTenant) {
      const deleteDefault = await fetchJson(
        `/platform/tenants/${defaultTenant.id}?confirm=DELETE`,
        { method: "DELETE", headers }
      );
      if (deleteDefault.res.status === 403) ok("Delete default rejected");
      else fail("Delete default rejected", deleteDefault.body);
    } else {
      fail("Delete default rejected", "default tenant not found");
    }

    const deleteActive = await fetchJson(
      `/platform/tenants/${tenantId}?confirm=DELETE`,
      { method: "DELETE", headers }
    );
    if (deleteActive.res.status === 400) ok("Delete active tenant rejected");
    else fail("Delete active tenant rejected", deleteActive.body);

    const suspend = await fetchJson(`/platform/tenants/${tenantId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        status: "suspended",
        reason: "MT-11 smoke cleanup",
      }),
    });
    if (suspend.res.status === 200 && suspend.body.data?.status === "suspended") {
      ok("Suspend dummy tenant");
    } else {
      fail("Suspend dummy tenant", suspend.body);
    }

    const preview = await fetchJson(`/platform/tenants/${tenantId}`, {
      method: "DELETE",
      headers,
    });
    if (
      preview.res.status === 400 &&
      preview.body.requires_confirm === "DELETE" &&
      preview.body.summary?.users >= 1
    ) {
      ok("Delete preview returns summary and confirm requirement");
    } else {
      fail("Delete preview returns summary and confirm requirement", preview.body);
    }

    const deleted = await fetchJson(
      `/platform/tenants/${tenantId}?confirm=DELETE`,
      { method: "DELETE", headers }
    );
    if (deleted.res.status === 200 && deleted.body.deleted_tenant?.slug === TEST_SLUG) {
      ok("Delete suspended dummy tenant with confirm");
    } else {
      fail("Delete suspended dummy tenant with confirm", deleted.body);
    }

    const gone = await fetchJson(`/platform/tenants/${tenantId}`, { headers });
    if (gone.res.status === 404) ok("Deleted tenant no longer exists");
    else fail("Deleted tenant no longer exists", gone.body);

    const existingAfter = await snapshotExistingTenants();
    if (sameSnapshot(existingBefore, existingAfter)) {
      ok("Existing default and al-hikmah unchanged");
    } else {
      fail("Existing tenant snapshot changed", {
        before: existingBefore,
        after: existingAfter,
      });
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
