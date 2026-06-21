/**
 * Smoke test — Push notification foundation (Phase 1)
 * Usage: node scripts/smoke-push-foundation.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const notificationService = require("../services/notificationService");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const DEFAULT_SLUG = "default";
const TEST_SLUG = "tenant-push-smoke-039";
const TEST_WALI_HP = "081234567890";
const TEST_WALI_PIN = "456789";
const TEST_TOKEN = "ExponentPushToken[smoke-foundation-039]";
const OTHER_TOKEN = "ExponentPushToken[smoke-other-tenant-039]";

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

async function waliLogin(slug, nomorHp, pin) {
  const res = await fetch(`${BASE}/wali-app/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: slug,
      nomor_hp: nomorHp,
      pin,
    }),
  });
  const body = await res.json();
  return { res, body };
}

async function waliApi(token, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function ensureMigration() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/039_push_notifications.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));

  const { rows } = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('wali_push_tokens', 'notification_logs')`
  );

  if (rows.length !== 2) {
    throw new Error("Migration tables missing");
  }
}

async function ensureFixtures() {
  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Tenant Push Smoke', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );

  const { rows: defaultTenantRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [DEFAULT_SLUG]
  );
  const { rows: testTenantRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );

  const defaultTenantId = defaultTenantRows[0]?.id;
  const testTenantId = testTenantRows[0]?.id;

  if (!defaultTenantId || !testTenantId) {
    throw new Error("Tenant fixtures missing");
  }

  const pinHash = await bcrypt.hash(TEST_WALI_PIN, 10);

  for (const [tenantId, hp] of [
    [defaultTenantId, TEST_WALI_HP],
    [testTenantId, "081234567891"],
  ]) {
    await pool.query(
      `INSERT INTO wali_akun (tenant_id, nomor_hp, nama, pin_hash, status, must_change_pin)
       VALUES ($1, $2, $3, $4, 'active', false)
       ON CONFLICT (tenant_id, nomor_hp)
       DO UPDATE SET pin_hash = EXCLUDED.pin_hash, status = 'active'`,
      [tenantId, hp, "Wali Push Smoke", pinHash]
    );
  }

  return { defaultTenantId, testTenantId };
}

async function cleanupSmokeRows(defaultTenantId, testTenantId) {
  await pool.query(
    `DELETE FROM notification_logs
     WHERE tenant_id = ANY($1::int[])
       AND type IN ('test', 'smoke')`,
    [[defaultTenantId, testTenantId]]
  );

  await pool.query(
    `DELETE FROM wali_push_tokens
     WHERE expo_push_token = ANY($1::text[])`,
    [[TEST_TOKEN, OTHER_TOKEN]]
  );
}

async function main() {
  console.log("=== Smoke: Push Notification Foundation ===\n");

  try {
    await ensureMigration();
    ok("Migration OK (wali_push_tokens + notification_logs)");
  } catch (err) {
    fail("Migration OK", err.message);
    throw err;
  }

  const { defaultTenantId, testTenantId } = await ensureFixtures();
  await cleanupSmokeRows(defaultTenantId, testTenantId);

  const loginDefault = await waliLogin(
    DEFAULT_SLUG,
    TEST_WALI_HP,
    TEST_WALI_PIN
  );

  if (!loginDefault.body.token) {
    fail(
      "Register token OK",
      `login failed: ${JSON.stringify(loginDefault.body)}`
    );
  } else {
    ok("Wali login default tenant");

    const register = await waliApi(
      loginDefault.body.token,
      "/wali-app/push-token",
      {
        method: "POST",
        body: JSON.stringify({
          expo_push_token: TEST_TOKEN,
          device_id: "smoke-device-039",
          platform: "android",
        }),
      }
    );

    if (register.res.status === 200 && register.body.success) {
      ok("Register token OK");
    } else {
      fail(
        "Register token OK",
        `${register.res.status} ${JSON.stringify(register.body)}`
      );
    }

    const registerDup = await waliApi(
      loginDefault.body.token,
      "/wali-app/push-token",
      {
        method: "POST",
        body: JSON.stringify({
          expo_push_token: TEST_TOKEN,
          device_id: "smoke-device-039-v2",
          platform: "android",
        }),
      }
    );

    const { rows: tokenCountRows } = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM wali_push_tokens
       WHERE tenant_id = $1 AND expo_push_token = $2`,
      [defaultTenantId, TEST_TOKEN]
    );

    if (
      registerDup.body.success &&
      tokenCountRows[0].total === 1
    ) {
      ok("Token duplicate tidak dobel (upsert)");
    } else {
      fail(
        "Token duplicate tidak dobel",
        `count=${tokenCountRows[0]?.total}`
      );
    }
  }

  const loginOther = await waliLogin(
    TEST_SLUG,
    "081234567891",
    TEST_WALI_PIN
  );

  if (!loginOther.body.token) {
    fail("Tenant isolation OK", "other tenant login failed");
  } else {
    const otherRegister = await waliApi(
      loginOther.body.token,
      "/wali-app/push-token",
      {
        method: "POST",
        body: JSON.stringify({
          expo_push_token: OTHER_TOKEN,
          device_id: "smoke-device-other",
          platform: "android",
        }),
      }
    );

    const { rows: defaultRows } = await pool.query(
      `SELECT wali_akun_id
       FROM wali_push_tokens
       WHERE tenant_id = $1 AND expo_push_token = $2`,
      [defaultTenantId, OTHER_TOKEN]
    );

    const { rows: otherRows } = await pool.query(
      `SELECT wali_akun_id
       FROM wali_push_tokens
       WHERE tenant_id = $1 AND expo_push_token = $2`,
      [testTenantId, OTHER_TOKEN]
    );

    if (
      otherRegister.body.success &&
      defaultRows.length === 0 &&
      otherRows.length === 1
    ) {
      ok("Tenant isolation OK");
    } else {
      fail(
        "Tenant isolation OK",
        `defaultLeak=${defaultRows.length} other=${otherRows.length}`
      );
    }
  }

  try {
    const { rows: akunRows } = await pool.query(
      `SELECT id FROM wali_akun
       WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, TEST_WALI_HP]
    );

    const log = await notificationService.createNotificationLog({
      tenantId: defaultTenantId,
      waliAkunId: akunRows[0].id,
      title: "Smoke Log",
      body: "Notification log insert smoke",
      type: "smoke",
      data: { source: "smoke-push-foundation" },
      status: notificationService.LOG_STATUS.PENDING,
    });

    if (log?.id) {
      ok("Notification log insert OK");
    } else {
      fail("Notification log insert OK", "no log id");
    }
  } catch (err) {
    fail("Notification log insert OK", err.message);
  }

  if (loginDefault.body.token) {
    const testNotif = await waliApi(
      loginDefault.body.token,
      "/wali-app/test-notification",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Test",
          body: "Push notification berhasil",
        }),
      }
    );

    if (
      testNotif.res.status === 200 &&
      testNotif.body.data?.log_id
    ) {
      ok("Test notification endpoint OK (log created)");
    } else {
      fail(
        "Test notification endpoint OK",
        `${testNotif.res.status} ${JSON.stringify(testNotif.body)}`
      );
    }
  } else {
    fail("Test notification endpoint OK", "no login token");
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("FATAL", err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
