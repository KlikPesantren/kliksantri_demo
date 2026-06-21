/**
 * Smoke test — Pengumuman push notification trigger
 * Usage: node scripts/smoke-pengumuman-notification.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const DEFAULT_SLUG = "default";
const TEST_SLUG = "tenant-peng-notif-smoke";
const TEST_TOKEN = "ExponentPushToken[smoke-pengumuman-039]";
const OTHER_TOKEN = "ExponentPushToken[smoke-peng-other-039]";
const WALI_HP_A = "08129992001";
const WALI_HP_B = "08129992002";

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

async function loginAdmin(username, password, tenantSlug) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: tenantSlug }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Admin login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function apiJson(token, apiPath, opts = {}) {
  const res = await fetch(`${BASE}${apiPath}`, {
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

async function countPengumumanLogs(tenantId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'pengumuman'`,
    [tenantId]
  );
  return rows[0].total;
}

async function ensureFixtures() {
  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Tenant Peng Notif Smoke', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );

  const { rows: defaultRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [DEFAULT_SLUG]
  );
  const { rows: testRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );

  const defaultTenantId = defaultRows[0]?.id;
  const testTenantId = testRows[0]?.id;
  if (!defaultTenantId || !testTenantId) {
    throw new Error("Tenant fixtures missing");
  }

  const adminHash = await bcrypt.hash("admin123", 10);
  const waliHash = await bcrypt.hash("456789", 10);

  for (const [tenantId, username] of [
    [defaultTenantId, "admin_peng_notif_a"],
    [testTenantId, "admin_peng_notif_b"],
  ]) {
    const ex = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND tenant_id = $2`,
      [username, tenantId]
    );
    if (!ex.rows.length) {
      await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, 'superadmin', 'Aktif', $4)`,
        [`Admin Peng Notif ${tenantId}`, username, adminHash, tenantId]
      );
    }
  }

  async function upsertWaliWithToken({ tenantId, nomorHp, tokenValue }) {
    await pool.query(
      `DELETE FROM wali_push_tokens
       WHERE tenant_id = $1 AND expo_push_token = $2`,
      [tenantId, tokenValue]
    );

    const akunInsert = await pool.query(
      `INSERT INTO wali_akun (tenant_id, nomor_hp, nama, pin_hash, status, must_change_pin)
       VALUES ($1, $2, $3, $4, 'active', false)
       ON CONFLICT (tenant_id, nomor_hp)
       DO UPDATE SET status = 'active'
       RETURNING id`,
      [tenantId, nomorHp, `Wali Peng ${nomorHp}`, waliHash]
    );

    await pool.query(
      `INSERT INTO wali_push_tokens (
         tenant_id, wali_akun_id, expo_push_token, device_id, platform, is_active, last_seen_at
       )
       VALUES ($1, $2, $3, $4, 'android', true, NOW())`,
      [
        tenantId,
        akunInsert.rows[0].id,
        tokenValue,
        `smoke-device-${nomorHp}`,
      ]
    );

    return { waliAkunId: akunInsert.rows[0].id };
  }

  const waliA = await upsertWaliWithToken({
    tenantId: defaultTenantId,
    nomorHp: WALI_HP_A,
    tokenValue: TEST_TOKEN,
  });

  const waliB = await upsertWaliWithToken({
    tenantId: testTenantId,
    nomorHp: WALI_HP_B,
    tokenValue: OTHER_TOKEN,
  });

  await pool.query(
    `DELETE FROM notification_logs
     WHERE tenant_id = ANY($1::int[]) AND type = 'pengumuman'`,
    [[defaultTenantId, testTenantId]]
  );

  await pool.query(
    `DELETE FROM pengumuman
     WHERE tenant_id = ANY($1::int[])
       AND judul LIKE 'SMOKE-PENG-%'`,
    [[defaultTenantId, testTenantId]]
  );

  return {
    defaultTenantId,
    testTenantId,
    waliA,
    waliB,
  };
}

function checkTapHandler() {
  const filePath = path.join(
    __dirname,
    "../wali-app/src/services/notificationNavigationService.js"
  );
  const source = fs.readFileSync(filePath, "utf8");
  return (
    source.includes("type === 'pengumuman'") &&
    source.includes("screen: 'Pengumuman'")
  );
}

async function main() {
  console.log("=== Smoke: Pengumuman Push Notification ===\n");

  const fixtures = await ensureFixtures();
  ok("Dummy push token wali tenant");

  if (checkTapHandler()) {
    ok("Tap handler pengumuman ada");
  } else {
    fail("Tap handler pengumuman ada", "handler tidak ditemukan");
  }

  const adminA = await loginAdmin(
    "admin_peng_notif_a",
    "admin123",
    DEFAULT_SLUG
  );
  const adminB = await loginAdmin(
    "admin_peng_notif_b",
    "admin123",
    TEST_SLUG
  );

  const logsBeforeNormal = await countPengumumanLogs(fixtures.defaultTenantId);

  const normal = await apiJson(adminA, "/pengumuman", {
    method: "POST",
    body: JSON.stringify({
      judul: "SMOKE-PENG-NORMAL",
      isi: "Isi panjang yang tidak boleh masuk push notification body smoke test",
      prioritas: "normal",
      is_active: true,
    }),
  });

  const logsAfterNormal = await countPengumumanLogs(fixtures.defaultTenantId);

  if (normal.body.success && logsAfterNormal === logsBeforeNormal) {
    ok("Create pengumuman normal → tidak kirim notif");
  } else {
    fail(
      "Create pengumuman normal → tidak kirim notif",
      `before=${logsBeforeNormal} after=${logsAfterNormal} body=${JSON.stringify(normal.body)}`
    );
  }

  const logsBeforePenting = await countPengumumanLogs(fixtures.defaultTenantId);

  const penting = await apiJson(adminA, "/pengumuman", {
    method: "POST",
    body: JSON.stringify({
      judul: "SMOKE-PENG-PENTING Libur Nasional",
      isi: "Detail libur panjang sekali yang tidak boleh masuk notifikasi",
      prioritas: "penting",
      is_active: true,
    }),
  });

  const logsAfterPenting = await countPengumumanLogs(fixtures.defaultTenantId);

  const pentingLog = await pool.query(
    `SELECT title, body, data
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'pengumuman'
     ORDER BY id DESC LIMIT 1`,
    [fixtures.defaultTenantId]
  );

  if (
    penting.body.success &&
    logsAfterPenting > logsBeforePenting &&
    pentingLog.rows[0]?.title === "Pengumuman Penting" &&
    pentingLog.rows[0]?.body === "SMOKE-PENG-PENTING Libur Nasional" &&
    !pentingLog.rows[0]?.body.includes("Detail libur")
  ) {
    ok("Create pengumuman penting → kirim notif");
  } else {
    fail(
      "Create pengumuman penting → kirim notif",
      JSON.stringify(pentingLog.rows[0])
    );
  }

  const logsBeforeUrgent = await countPengumumanLogs(fixtures.defaultTenantId);

  const urgent = await apiJson(adminA, "/pengumuman", {
    method: "POST",
    body: JSON.stringify({
      judul: "SMOKE-PENG-URGENT Evakuasi",
      isi: "Instruksi evakuasi detail panjang",
      prioritas: "urgent",
      is_active: true,
    }),
  });

  const logsAfterUrgent = await countPengumumanLogs(fixtures.defaultTenantId);

  const urgentLog = await pool.query(
    `SELECT title, data
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'pengumuman'
     ORDER BY id DESC LIMIT 1`,
    [fixtures.defaultTenantId]
  );

  if (
    urgent.body.success &&
    logsAfterUrgent > logsBeforeUrgent &&
    urgentLog.rows[0]?.title === "Pengumuman Urgent" &&
    urgentLog.rows[0]?.data?.type === "pengumuman" &&
    urgentLog.rows[0]?.data?.pengumuman_id
  ) {
    ok("Create pengumuman urgent → kirim notif");
    ok("Notification log tercatat");
    ok("Payload type=pengumuman");
  } else {
    fail("Create pengumuman urgent → kirim notif", JSON.stringify(urgentLog.rows[0]));
    fail("Notification log tercatat", `count=${logsAfterUrgent}`);
    fail("Payload type=pengumuman", JSON.stringify(urgentLog.rows[0]?.data));
  }

  const logsBeforeTenantB = await countPengumumanLogs(fixtures.testTenantId);
  const logsBeforeTenantA = await countPengumumanLogs(fixtures.defaultTenantId);

  const urgentB = await apiJson(adminB, "/pengumuman", {
    method: "POST",
    body: JSON.stringify({
      judul: "SMOKE-PENG-URGENT-TENANT-B",
      isi: "Hanya tenant B",
      prioritas: "urgent",
      is_active: true,
    }),
  });

  const logsAfterTenantB = await countPengumumanLogs(fixtures.testTenantId);
  const logsAfterTenantA = await countPengumumanLogs(fixtures.defaultTenantId);

  const { rows: crossLeak } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notification_logs
     WHERE tenant_id = $1
       AND type = 'pengumuman'
       AND body = 'SMOKE-PENG-URGENT-TENANT-B'`,
    [fixtures.defaultTenantId]
  );

  if (
    urgentB.body.success &&
    logsAfterTenantB > logsBeforeTenantB &&
    crossLeak[0].total === 0 &&
    logsAfterTenantA === logsBeforeTenantA
  ) {
    ok("Tenant isolation aman");
  } else {
    fail(
      "Tenant isolation aman",
      `A=${logsAfterTenantA}/${logsBeforeTenantA} B=${logsAfterTenantB}/${logsBeforeTenantB} leak=${crossLeak[0].total}`
    );
  }

  await pool.query(
    `DELETE FROM wali_push_tokens WHERE tenant_id = $1`,
    [fixtures.defaultTenantId]
  );

  const noToken = await apiJson(adminA, "/pengumuman", {
    method: "POST",
    body: JSON.stringify({
      judul: "SMOKE-PENG-NO-TOKEN",
      isi: "Push gagal tapi insert harus sukses",
      prioritas: "penting",
      is_active: true,
    }),
  });

  const { rows: pengRows } = await pool.query(
    `SELECT id FROM pengumuman
     WHERE tenant_id = $1 AND judul = 'SMOKE-PENG-NO-TOKEN'
     LIMIT 1`,
    [fixtures.defaultTenantId]
  );

  if (noToken.body.success && pengRows.length === 1) {
    ok("Push gagal tidak rollback pengumuman");
  } else {
    fail(
      "Push gagal tidak rollback pengumuman",
      JSON.stringify(noToken.body)
    );
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
