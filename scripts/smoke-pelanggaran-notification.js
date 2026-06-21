/**
 * Smoke test — Pelanggaran push notification trigger
 * Usage: node scripts/smoke-pelanggaran-notification.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");
const notificationService = require("../services/notificationService");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const DEFAULT_SLUG = "default";
const TEST_SLUG = "tenant-pel-notif-smoke";
const TEST_TOKEN = "ExponentPushToken[smoke-pelanggaran-039]";
const OTHER_TOKEN = "ExponentPushToken[smoke-pel-other-039]";
const WALI_HP_A = "08129990001";
const WALI_HP_B = "08129990002";
const WALI_PIN = "456789";

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

async function apiJson(token, path, opts = {}) {
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

async function ensureFixtures() {
  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Tenant Pel Notif Smoke', 'active')
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
  const waliHash = await bcrypt.hash(WALI_PIN, 10);

  for (const [tenantId, username] of [
    [defaultTenantId, "admin_pel_notif_a"],
    [testTenantId, "admin_pel_notif_b"],
  ]) {
    const ex = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND tenant_id = $2`,
      [username, tenantId]
    );
    if (!ex.rows.length) {
      await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, 'superadmin', 'Aktif', $4)`,
        [`Admin Pel Notif ${tenantId}`, username, adminHash, tenantId]
      );
    }
  }

  async function upsertSantriWali({
    tenantId,
    nis,
    nama,
    nomorHp,
    withToken,
    tokenValue,
  }) {
    const existingSantri = await pool.query(
      `SELECT id FROM santri WHERE tenant_id = $1 AND nis = $2 LIMIT 1`,
      [tenantId, nis]
    );
    const existingSantriId = existingSantri.rows[0]?.id ?? null;

    if (existingSantriId) {
      await pool.query(
        `DELETE FROM pelanggaran WHERE tenant_id = $1 AND santri_id = $2`,
        [tenantId, existingSantriId]
      );
      await pool.query(
        `UPDATE santri SET wali_id = NULL WHERE id = $1 AND tenant_id = $2`,
        [existingSantriId, tenantId]
      );
      await pool.query(
        `DELETE FROM wali_santri WHERE tenant_id = $1 AND santri_id = $2`,
        [tenantId, existingSantriId]
      );
      await pool.query(
        `DELETE FROM santri WHERE id = $1 AND tenant_id = $2`,
        [existingSantriId, tenantId]
      );
    }

    await pool.query(
      `DELETE FROM wali_push_tokens
       WHERE tenant_id = $1 AND expo_push_token = $2`,
      [tenantId, tokenValue || TEST_TOKEN]
    );

    const santriInsert = await pool.query(
      `INSERT INTO santri (nis, nama, tenant_id, nomor_hp_ortu, orang_tua)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [nis, nama, tenantId, nomorHp, `Wali ${nama}`]
    );
    const santriId = santriInsert.rows[0].id;

    await pool.query(
      `INSERT INTO wali_santri (nama, nomor_hp, santri_id, tenant_id)
       VALUES ($1, $2, $3, $4)`,
      [`Wali ${nama}`, nomorHp, santriId, tenantId]
    );

    const akunInsert = await pool.query(
      `INSERT INTO wali_akun (tenant_id, nomor_hp, nama, pin_hash, status, must_change_pin)
       VALUES ($1, $2, $3, $4, 'active', false)
       ON CONFLICT (tenant_id, nomor_hp)
       DO UPDATE SET pin_hash = EXCLUDED.pin_hash, status = 'active'
       RETURNING id`,
      [tenantId, nomorHp, `Wali ${nama}`, waliHash]
    );

    if (withToken && tokenValue) {
      await pool.query(
        `INSERT INTO wali_push_tokens (
           tenant_id, wali_akun_id, expo_push_token, device_id, platform, is_active, last_seen_at
         )
         VALUES ($1, $2, $3, $4, 'android', true, NOW())`,
        [
          tenantId,
          akunInsert.rows[0].id,
          tokenValue,
          `smoke-device-${nis}`,
        ]
      );
    }

    return { santriId, waliAkunId: akunInsert.rows[0].id };
  }

  const fixtureA = await upsertSantriWali({
    tenantId: defaultTenantId,
    nis: "SMOKE-PEL-A",
    nama: "Ahmad Smoke",
    nomorHp: WALI_HP_A,
    withToken: true,
    tokenValue: TEST_TOKEN,
  });

  const fixtureB = await upsertSantriWali({
    tenantId: testTenantId,
    nis: "SMOKE-PEL-B",
    nama: "Budi Smoke",
    nomorHp: WALI_HP_B,
    withToken: true,
    tokenValue: OTHER_TOKEN,
  });

  const fixtureNoToken = await upsertSantriWali({
    tenantId: defaultTenantId,
    nis: "SMOKE-PEL-NOTOKEN",
    nama: "No Token Smoke",
    nomorHp: "08129990003",
    withToken: false,
    tokenValue: null,
  });

  await pool.query(
    `DELETE FROM notification_logs
     WHERE tenant_id = ANY($1::int[]) AND type = 'pelanggaran'`,
    [[defaultTenantId, testTenantId]]
  );

  return {
    defaultTenantId,
    testTenantId,
    fixtureA,
    fixtureB,
    fixtureNoToken,
  };
}

async function main() {
  console.log("=== Smoke: Pelanggaran Push Notification ===\n");

  const fixtures = await ensureFixtures();
  ok("Dummy push token registered");

  const adminA = await loginAdmin(
    "admin_pel_notif_a",
    "admin123",
    DEFAULT_SLUG
  );
  const adminB = await loginAdmin(
    "admin_pel_notif_b",
    "admin123",
    TEST_SLUG
  );

  const beforeLogs = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'pelanggaran'`,
    [fixtures.defaultTenantId]
  );

  const createPel = await apiJson(adminA, "/pelanggaran", {
    method: "POST",
    body: JSON.stringify({
      santri_id: fixtures.fixtureA.santriId,
      tanggal: "2026-06-20",
      jam: "10:00",
      jenis: "Terlambat",
      tingkat: "ringan",
      poin: 5,
      catatan: "Smoke test catatan panjang yang tidak boleh masuk push",
      tindakan: "Teguran",
      petugas: "Admin Smoke",
    }),
  });

  if (createPel.res.status === 200 && createPel.body.success) {
    ok("Create pelanggaran sukses");
  } else {
    fail(
      "Create pelanggaran sukses",
      `${createPel.res.status} ${JSON.stringify(createPel.body)}`
    );
  }

  const afterLogs = await pool.query(
    `SELECT id, type, data, status, body
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'pelanggaran'
     ORDER BY id DESC
     LIMIT 1`,
    [fixtures.defaultTenantId]
  );

  if (afterLogs.rows.length > beforeLogs.rows[0].total) {
    ok("Notification log tercatat");
  } else {
    fail("Notification log tercatat", "log tidak bertambah");
  }

  const logRow = afterLogs.rows[0];
  if (
    logRow?.data?.type === "pelanggaran" &&
    Number(logRow?.data?.santri_id) === fixtures.fixtureA.santriId
  ) {
    ok("Payload type=pelanggaran benar");
  } else {
    fail("Payload type=pelanggaran benar", JSON.stringify(logRow?.data));
  }

  if (
    logRow?.body === "[Ahmad Smoke] mendapatkan pelanggaran baru." &&
    !logRow.body.includes("catatan")
  ) {
    ok("Body notifikasi aman (tanpa catatan sensitif)");
  } else {
    fail("Body notifikasi aman", logRow?.body);
  }

  const createOtherTenant = await apiJson(adminB, "/pelanggaran", {
    method: "POST",
    body: JSON.stringify({
      santri_id: fixtures.fixtureB.santriId,
      tanggal: "2026-06-20",
      jam: "11:00",
      jenis: "Terlambat",
      tingkat: "ringan",
      poin: 3,
      catatan: "Tenant B only",
      tindakan: "Teguran",
      petugas: "Admin B",
    }),
  });

  const { rows: leakRows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notification_logs
     WHERE tenant_id = $1
       AND type = 'pelanggaran'
       AND wali_akun_id = $2`,
    [fixtures.defaultTenantId, fixtures.fixtureB.waliAkunId]
  );

  const { rows: tenantBLogRows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'pelanggaran'`,
    [fixtures.testTenantId]
  );

  if (
    createOtherTenant.body.success &&
    leakRows[0].total === 0 &&
    tenantBLogRows[0].total >= 1
  ) {
    ok("Tenant isolation aman");
  } else {
    fail(
      "Tenant isolation aman",
      `leak=${leakRows[0].total} tenantBLogs=${tenantBLogRows[0].total}`
    );
  }

  const createNoToken = await apiJson(adminA, "/pelanggaran", {
    method: "POST",
    body: JSON.stringify({
      santri_id: fixtures.fixtureNoToken.santriId,
      tanggal: "2026-06-20",
      jam: "12:00",
      jenis: "Terlambat",
      tingkat: "ringan",
      poin: 1,
      catatan: "No token wali",
      tindakan: "Teguran",
      petugas: "Admin Smoke",
    }),
  });

  const { rows: pelRows } = await pool.query(
    `SELECT id FROM pelanggaran
     WHERE tenant_id = $1 AND santri_id = $2
     ORDER BY id DESC LIMIT 1`,
    [fixtures.defaultTenantId, fixtures.fixtureNoToken.santriId]
  );

  if (createNoToken.body.success && pelRows.length === 1) {
    ok("Push gagal tidak rollback pelanggaran");
  } else {
    fail(
      "Push gagal tidak rollback pelanggaran",
      JSON.stringify(createNoToken.body)
    );
  }

  const direct = await notificationService.sendPushToWaliBySantriId({
    tenantId: fixtures.defaultTenantId,
    santriId: fixtures.fixtureA.santriId,
    title: "Pelanggaran Baru",
    type: "pelanggaran",
    data: {
      type: "pelanggaran",
      santri_id: fixtures.fixtureA.santriId,
    },
  });

  if (direct && Array.isArray(direct.results)) {
    ok("sendPushToWaliBySantriId callable");
  } else {
    fail("sendPushToWaliBySantriId callable", JSON.stringify(direct));
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
