/**
 * Smoke test - MT-12 Billing Foundation
 * Usage: node scripts/smoke-mt12-billing-foundation.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const SUFFIX = Date.now().toString(36);
const TEST_SLUG = `tenant-mt12-${SUFFIX}`;
const ADMIN_USER = `admin.mt12.${SUFFIX}`;
const ADMIN_PASS = "Mt12SmokePass1";

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

async function fetchJson(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function snapshotExistingTenants() {
  const { rows } = await pool.query(
    `SELECT slug, status, plan_code, billing_status, subscription_expires_at
     FROM tenants
     WHERE slug IN ('default', 'al-hikmah')
     ORDER BY slug`
  );
  return rows.map((row) => ({
    ...row,
    subscription_expires_at:
      row.subscription_expires_at?.toISOString?.() || row.subscription_expires_at,
  }));
}

function sameSnapshot(before, after) {
  return JSON.stringify(before) === JSON.stringify(after);
}

async function assertMigrationApplied() {
  const migrationPath = path.join(
    __dirname,
    "../migrations/045_tenant_billing_foundation.sql"
  );
  if (!fs.existsSync(migrationPath)) {
    fail("Migration 045 exists", migrationPath);
    return false;
  }
  ok("Migration 045 exists");

  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'tenants'
       AND column_name IN (
         'plan_code',
         'billing_status',
         'subscription_started_at',
         'subscription_expires_at',
         'last_payment_at',
         'next_invoice_at',
         'billing_notes'
       )`
  );

  if (rows.length === 7) {
    ok("Migration 045 applied");
    return true;
  }

  fail("Migration 045 applied", rows.map((row) => row.column_name));
  return false;
}

async function run() {
  console.log("=== Smoke: MT-12 Billing Foundation ===\n");

  let tenantId = null;
  let token = null;
  let existingBefore = [];

  try {
    const migrationOk = await assertMigrationApplied();
    if (!migrationOk) return;

    existingBefore = await snapshotExistingTenants();
    const requiredExisting = new Map(existingBefore.map((row) => [row.slug, row]));
    const defaultTenant = requiredExisting.get("default");
    const alHikmahTenant = requiredExisting.get("al-hikmah");

    if (defaultTenant?.billing_status === "active") ok("Tenant default billing active");
    else fail("Tenant default billing active", defaultTenant);

    if (alHikmahTenant?.billing_status === "active") ok("Tenant al-hikmah billing active");
    else fail("Tenant al-hikmah billing active", alHikmahTenant);

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
    token = login.body.token;
    ok("platform login");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const created = await fetchJson("/platform/tenants", {
      method: "POST",
      headers,
      body: JSON.stringify({
        nama: "Pesantren MT12 Billing",
        slug: TEST_SLUG,
        admin_nama: "Admin MT12",
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
    tenantId = created.body.tenant_id;
    ok("Create dummy tenant");

    const billing = await fetchJson(`/platform/tenants/${tenantId}/billing`, {
      headers,
    });
    if (
      billing.res.status === 200 &&
      billing.body.data?.plan_code === "premium" &&
      billing.body.data?.billing_status === "active"
    ) {
      ok("GET billing works");
    } else {
      fail("GET billing works", billing.body);
    }

    const overdue = await fetchJson(`/platform/tenants/${tenantId}/billing`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        plan_code: "standard",
        billing_status: "overdue",
        billing_notes: "MT-12 smoke overdue",
      }),
    });
    if (
      overdue.res.status === 200 &&
      overdue.body.data?.billing_status === "overdue" &&
      overdue.body.data?.plan_code === "standard"
    ) {
      ok("PATCH billing overdue works");
    } else {
      fail("PATCH billing overdue works", overdue.body);
    }

    const extendTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const extended = await fetchJson(`/platform/tenants/${tenantId}/billing`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        subscription_expires_at: extendTo.toISOString(),
        billing_status: "active",
      }),
    });
    if (
      extended.res.status === 200 &&
      extended.body.data?.billing_status === "active" &&
      new Date(extended.body.data.subscription_expires_at).getTime() >=
        extendTo.getTime() - 1000
    ) {
      ok("Extend 30 days works");
    } else {
      fail("Extend 30 days works", extended.body);
    }

    const suspended = await fetchJson(`/platform/tenants/${tenantId}/billing`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ billing_status: "suspended" }),
    });
    const suspendedDetail = await fetchJson(`/platform/tenants/${tenantId}`, {
      headers,
    });
    if (
      suspended.res.status === 200 &&
      suspended.body.data?.billing_status === "suspended" &&
      suspendedDetail.body.data?.status === "suspended"
    ) {
      ok("Billing suspended changes tenant status suspended");
    } else {
      fail("Billing suspended changes tenant status suspended", {
        billing: suspended.body,
        detail: suspendedDetail.body,
      });
    }

    const reactivated = await fetchJson(`/platform/tenants/${tenantId}/billing`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ billing_status: "active" }),
    });
    const activeDetail = await fetchJson(`/platform/tenants/${tenantId}`, {
      headers,
    });
    if (
      reactivated.res.status === 200 &&
      reactivated.body.data?.billing_status === "active" &&
      activeDetail.body.data?.status === "active"
    ) {
      ok("Reactivate billing changes tenant status active");
    } else {
      fail("Reactivate billing changes tenant status active", {
        billing: reactivated.body,
        detail: activeDetail.body,
      });
    }

    const list = await fetchJson(`/platform/tenants?q=${TEST_SLUG}`, {
      headers,
    });
    const listed = list.body.data?.find((tenant) => tenant.slug === TEST_SLUG);
    if (
      list.res.status === 200 &&
      listed?.plan_code &&
      listed?.billing_status &&
      listed?.subscription_expires_at
    ) {
      ok("Tenant list shows billing fields");
    } else {
      fail("Tenant list shows billing fields", list.body);
    }

    const dashboard = await fetchJson("/platform/stats/summary", { headers });
    if (
      dashboard.res.status === 200 &&
      Number.isInteger(dashboard.body.billing?.active_subscriptions) &&
      Number.isInteger(dashboard.body.billing?.trial_tenants) &&
      Number.isInteger(dashboard.body.billing?.overdue_tenants) &&
      Number.isInteger(dashboard.body.billing?.expiring_soon_7_days)
    ) {
      ok("Platform dashboard summary includes billing KPI");
    } else {
      fail("Platform dashboard summary includes billing KPI", dashboard.body);
    }

    const features = await fetchJson(`/platform/tenants/${tenantId}/features`, {
      headers,
    });
    if (features.res.status === 200 && features.body.current_package?.id === "basic") {
      ok("Existing feature/package still works");
    } else {
      fail("Existing feature/package still works", features.body);
    }

    await fetchJson(`/platform/tenants/${tenantId}/billing`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ billing_status: "suspended" }),
    });
    const deleted = await fetchJson(
      `/platform/tenants/${tenantId}?confirm=DELETE`,
      { method: "DELETE", headers }
    );
    if (deleted.res.status === 200) ok("Cleanup dummy tenant");
    else fail("Cleanup dummy tenant", deleted.body);

    tenantId = null;

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
    if (tenantId && token) {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        await fetchJson(`/platform/tenants/${tenantId}/billing`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ billing_status: "suspended" }),
        });
        await fetchJson(`/platform/tenants/${tenantId}?confirm=DELETE`, {
          method: "DELETE",
          headers,
        });
      } catch (_) {
        /* best effort cleanup */
      }
    }

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
