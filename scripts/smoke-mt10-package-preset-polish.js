/**
 * Smoke test - MT-10 Package Preset Polish
 * Usage: node scripts/smoke-mt10-package-preset-polish.js
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const TEST_SLUG = "tenant-mt10-package";
const ADMIN_USER = "admin.mt10package";
const ADMIN_PASS = "Mt10SmokePass1";

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

async function cleanup() {
  const { rows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );
  if (!rows.length) return;

  const tid = rows[0].id;
  await pool.query(`DELETE FROM audit_logs WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM tenant_features WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM users WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM unit_pendidikan WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM profil_pesantren WHERE tenant_id = $1`, [tid]);
  await pool.query(`DELETE FROM tenants WHERE id = $1`, [tid]);
}

function mapFeatures(features = []) {
  return Object.fromEntries(features.map((feature) => [feature.key, feature]));
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
  console.log("=== Smoke: MT-10 Package Preset Polish ===\n");

  const existingBefore = await snapshotExistingTenants();

  try {
    await cleanup();

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
        nama: "Pesantren MT10 Package",
        slug: TEST_SLUG,
        admin_nama: "Admin MT10",
        admin_username: ADMIN_USER,
        admin_password: ADMIN_PASS,
        package: "basic",
        create_default_unit_users: false,
      }),
    });

    if (created.res.status !== 201 || created.body.tenant?.slug !== TEST_SLUG) {
      fail("Create tenant Basic", created.body);
      return;
    }
    ok("Create tenant Basic");

    const tenantId = created.body.tenant_id;
    const basic = await fetchJson(`/platform/tenants/${tenantId}/features`, {
      headers,
    });
    const basicMap = mapFeatures(basic.body.features);
    if (
      basic.body.current_package?.id === "basic" &&
      basicMap.rfid?.enabled === false &&
      basicMap.sahriyah?.enabled === false &&
      basicMap.buku_kas?.enabled === true
    ) {
      ok("Basic package: RFID off, Sahriyah off, Buku Kas on");
    } else {
      fail("Basic package feature state", {
        current_package: basic.body.current_package,
        rfid: basicMap.rfid,
        sahriyah: basicMap.sahriyah,
        buku_kas: basicMap.buku_kas,
      });
    }

    const premium = await fetchJson(`/platform/tenants/${tenantId}/package`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ package: "premium" }),
    });
    const premiumMap = mapFeatures(premium.body.features);
    if (
      premium.res.status === 200 &&
      premium.body.current_package?.id === "premium" &&
      premiumMap.rfid?.enabled === true &&
      premiumMap.wali_app?.enabled === true &&
      premiumMap.kas_instansi?.enabled === true
    ) {
      ok("Apply Premium turns premium features on");
    } else {
      fail("Apply Premium", premium.body);
    }

    const basicAgain = await fetchJson(`/platform/tenants/${tenantId}/package`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ package: "basic" }),
    });
    const basicAgainMap = mapFeatures(basicAgain.body.features);
    if (
      basicAgain.res.status === 200 &&
      basicAgain.body.current_package?.id === "basic" &&
      basicAgainMap.rfid?.enabled === false &&
      basicAgainMap.wali_app?.enabled === false &&
      basicAgainMap.kas_instansi?.enabled === false
    ) {
      ok("Apply Basic again turns premium features off");
    } else {
      fail("Apply Basic again", basicAgain.body);
    }

    const coreKeys = ["dashboard", "profil", "sistem"];
    if (coreKeys.every((key) => basicAgainMap[key]?.enabled === true)) {
      ok("Core features stay on");
    } else {
      fail("Core features stay on", coreKeys.map((key) => basicAgainMap[key]));
    }

    const patchCoreOff = await fetchJson(`/platform/tenants/${tenantId}/features`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        features: [{ key: "dashboard", enabled: false }],
      }),
    });
    if (patchCoreOff.res.status === 400) {
      ok("PATCH cannot disable core feature");
    } else {
      fail("PATCH cannot disable core feature", patchCoreOff.body);
    }

    const invalidPackage = await fetchJson(`/platform/tenants/${tenantId}/package`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ package: "enterprise" }),
    });
    if (invalidPackage.res.status === 400) {
      ok("Invalid package rejected with 400");
    } else {
      fail("Invalid package rejected with 400", invalidPackage.body);
    }

    const noAuthApply = await fetchJson(`/platform/tenants/${tenantId}/package`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: "premium" }),
    });
    if ([401, 403].includes(noAuthApply.res.status)) {
      ok("Apply package requires platform auth");
    } else {
      fail("Apply package requires platform auth", noAuthApply.res.status);
    }

    const existingAfter = await snapshotExistingTenants();
    if (sameSnapshot(existingBefore, existingAfter)) {
      ok("Existing default and al-hikmah unchanged");
    } else {
      fail("Existing tenant snapshot changed", { before: existingBefore, after: existingAfter });
    }

    await cleanup();
    ok("cleanup test tenant");
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
