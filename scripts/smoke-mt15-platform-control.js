/**
 * Smoke test - MT-15 Platform Control & Tenant Self-Service Readiness
 * Usage: node scripts/smoke-mt15-platform-control.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const SUFFIX = Date.now().toString(36);
const TEST_SLUG = `tenant-mt15-${SUFFIX}`;
const DUPLICATE_SLUG = `tenant-mt15-dup-${SUFFIX}`;

let passed = 0;
let failed = 0;
let platformToken = null;
let createdTenantId = null;

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

async function platformLogin() {
  const login = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.SMOKE_PLATFORM_USER || "platform",
      password: process.env.SMOKE_PLATFORM_PASS || "123456",
    }),
  });
  platformToken = login.body?.token || null;
  if (platformToken) ok("Platform login");
  else fail("Platform login", login.body);
  return Boolean(platformToken);
}

function platformHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${platformToken}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function assertMigration046() {
  const migrationPath = path.join(
    __dirname,
    "../migrations/046_platform_settings_announcements.sql"
  );
  if (!fs.existsSync(migrationPath)) {
    fail("Migration 046 exists");
    return false;
  }
  ok("Migration 046 file exists");

  const tables = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('platform_settings', 'platform_announcements')`
  );
  if (tables.rows.length === 2) {
    ok("Migration 046 applied");
    return true;
  }
  fail("Migration 046 applied", tables.rows.map((r) => r.table_name));
  return false;
}

async function snapshotCoreTenants() {
  const { rows } = await pool.query(
    `SELECT slug, nama, status, billing_status
     FROM tenants
     WHERE slug IN ('default', 'al-hikmah')
     ORDER BY slug`
  );
  return rows;
}

async function run() {
  console.log("=== Smoke: MT-15 Platform Control ===\n");

  const beforeCore = await snapshotCoreTenants();

  try {
    if (!(await assertMigration046())) return;
    if (!(await platformLogin())) return;

    const settingsGet = await fetchJson("/platform/settings", {
      headers: platformHeaders(),
    });
    if (settingsGet.body?.data?.settings?.platform_name) {
      ok("GET /platform/settings");
    } else {
      fail("GET /platform/settings", settingsGet.body);
    }

    const settingsPatch = await fetchJson("/platform/settings", {
      method: "PATCH",
      headers: platformHeaders(),
      body: JSON.stringify({
        tagline: `MT-15 smoke ${SUFFIX}`,
      }),
    });
    if (settingsPatch.body?.data?.settings?.tagline?.includes("MT-15 smoke")) {
      ok("PATCH /platform/settings");
    } else {
      fail("PATCH /platform/settings", settingsPatch.body);
    }

    const publicSettings = await fetchJson("/public/platform/settings");
    if (publicSettings.body?.data?.platform_name) {
      ok("GET /public/platform/settings");
    } else {
      fail("GET /public/platform/settings", publicSettings.body);
    }

    const createTenant = await fetchJson("/platform/tenants", {
      method: "POST",
      headers: platformHeaders(),
      body: JSON.stringify({
        nama: `MT15 Smoke ${SUFFIX}`,
        slug: TEST_SLUG,
        admin_username: `admin.mt15.${SUFFIX}`,
        package: "basic",
      }),
    });
    createdTenantId =
      createTenant.body?.tenant_id ||
      createTenant.body?.data?.tenant?.id ||
      createTenant.body?.tenant?.id;
    if (createdTenantId) ok("Create test tenant");
    else fail("Create test tenant", createTenant.body);

    const editName = await fetchJson(`/platform/tenants/${createdTenantId}`, {
      method: "PATCH",
      headers: platformHeaders(),
      body: JSON.stringify({
        nama: `MT15 Updated ${SUFFIX}`,
      }),
    });
    if (editName.body?.data?.nama?.includes("Updated")) ok("Edit tenant name");
    else fail("Edit tenant name", editName.body);

    const newSlug = `${TEST_SLUG}-renamed`;
    const editSlug = await fetchJson(`/platform/tenants/${createdTenantId}`, {
      method: "PATCH",
      headers: platformHeaders(),
      body: JSON.stringify({ slug: newSlug }),
    });
    if (editSlug.body?.data?.slug === newSlug) ok("Edit tenant slug (non-default)");
    else fail("Edit tenant slug (non-default)", editSlug.body);

    const dupSlug = await fetchJson(`/platform/tenants/${createdTenantId}`, {
      method: "PATCH",
      headers: platformHeaders(),
      body: JSON.stringify({ slug: "default" }),
    });
    if (dupSlug.res.status === 409) ok("Slug duplicate rejected");
    else fail("Slug duplicate rejected", dupSlug.body);

    const publicProfile = await fetchJson(`/public/tenants/${newSlug}/profile`);
    if (publicProfile.body?.data?.slug === newSlug) {
      ok("Public profile follows new slug");
    } else {
      fail("Public profile follows new slug", publicProfile.body);
    }

    const oldSlugProfile = await fetchJson(`/public/tenants/${TEST_SLUG}/profile`);
    if (oldSlugProfile.res.status === 404) ok("Old slug public profile 404");
    else fail("Old slug public profile 404", oldSlugProfile.body);

    const announcementCreate = await fetchJson("/platform/announcements", {
      method: "POST",
      headers: platformHeaders(),
      body: JSON.stringify({
        title: `MT15 Announcement ${SUFFIX}`,
        body: "Smoke test announcement body",
        status: "published",
      }),
    });
    const announcementId = announcementCreate.body?.data?.id;
    if (announcementId) ok("Platform announcement publish");
    else fail("Platform announcement publish", announcementCreate.body);

    const tenantAnnouncements = await fetchJson("/public/platform/announcements");
    const found = (tenantAnnouncements.body?.data || []).some(
      (item) => item.id === announcementId
    );
    if (found) ok("Tenant can read published announcement");
    else fail("Tenant can read published announcement", tenantAnnouncements.body);

    const { rows: expiredCandidates } = await pool.query(
      `SELECT id FROM tenants WHERE id = $1`,
      [createdTenantId]
    );
    if (expiredCandidates.length === 1) {
      await pool.query(
        `UPDATE tenants
         SET subscription_expires_at = NOW() - INTERVAL '1 day',
             billing_status = 'active',
             status = 'active'
         WHERE id = $1`,
        [createdTenantId]
      );

      process.env.BILLING_APPLY = "1";
      delete process.env.BILLING_SUSPEND;
      const { execSync } = require("child_process");
      execSync("node scripts/check-tenant-billing-expiry.js", {
        cwd: path.join(__dirname, ".."),
        stdio: "pipe",
        env: { ...process.env, BILLING_APPLY: "1" },
      });

      const { rows: overdueRows } = await pool.query(
        `SELECT billing_status FROM tenants WHERE id = $1`,
        [createdTenantId]
      );
      if (overdueRows[0]?.billing_status === "overdue") {
        ok("Billing checker overdue works");
      } else {
        fail("Billing checker overdue works", overdueRows[0]);
      }

      await pool.query(
        `UPDATE tenants
         SET subscription_expires_at = NOW() - INTERVAL '10 days',
             billing_status = 'overdue',
             status = 'active'
         WHERE id = $1`,
        [createdTenantId]
      );

      execSync("node scripts/check-tenant-billing-expiry.js", {
        cwd: path.join(__dirname, ".."),
        stdio: "pipe",
        env: {
          ...process.env,
          BILLING_APPLY: "1",
          BILLING_SUSPEND: "1",
          BILLING_GRACE_DAYS: "7",
        },
      });

      const { rows: suspendedRows } = await pool.query(
        `SELECT billing_status, status FROM tenants WHERE id = $1`,
        [createdTenantId]
      );
      if (
        suspendedRows[0]?.billing_status === "suspended" &&
        suspendedRows[0]?.status === "suspended"
      ) {
        ok("Billing checker suspend after grace works");
      } else {
        fail("Billing checker suspend after grace works", suspendedRows[0]);
      }
    }

    const afterCore = await snapshotCoreTenants();
    if (JSON.stringify(beforeCore) === JSON.stringify(afterCore)) {
      ok("Tenant default/al-hikmah not broken");
    } else {
      fail("Tenant default/al-hikmah not broken", { beforeCore, afterCore });
    }
  } finally {
    if (createdTenantId) {
      await pool.query(
        `DELETE FROM platform_announcements WHERE title ILIKE '%MT15 Announcement%'`
      ).catch(() => {});
      await pool.query(
        `UPDATE tenants SET status = 'inactive' WHERE id = $1 AND slug LIKE 'tenant-mt15-%'`,
        [createdTenantId]
      ).catch(() => {});
    }
    await pool.end();
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("ERR", err);
  try {
    await pool.end();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
