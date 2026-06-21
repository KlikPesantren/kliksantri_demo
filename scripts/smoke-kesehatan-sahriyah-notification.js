/**
 * Smoke test — Kesehatan + Sahriyah push notification triggers
 * Usage: node scripts/smoke-kesehatan-sahriyah-notification.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const DEFAULT_SLUG = "default";
const TEST_SLUG = "tenant-kes-sah-smoke";
const TEST_TOKEN = "ExponentPushToken[smoke-kes-sah-039]";
const OTHER_TOKEN = "ExponentPushToken[smoke-kes-sah-other-039]";
const WALI_HP_A = "08129993001";
const WALI_HP_B = "08129993002";
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

async function countLogs(tenantId, type) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notification_logs
     WHERE tenant_id = $1 AND type = $2`,
    [tenantId, type]
  );
  return rows[0].total;
}

async function ensureFixtures() {
  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Tenant Kes Sah Smoke', 'active')
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
    [defaultTenantId, "admin_kes_sah_a"],
    [testTenantId, "admin_kes_sah_b"],
  ]) {
    const ex = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND tenant_id = $2`,
      [username, tenantId]
    );
    if (!ex.rows.length) {
      await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, 'superadmin', 'Aktif', $4)`,
        [`Admin Kes Sah ${tenantId}`, username, adminHash, tenantId]
      );
    }
  }

  async function upsertSantriWali({
    tenantId,
    nis,
    nama,
    nomorHp,
    tokenValue,
    withToken,
  }) {
    const existing = await pool.query(
      `SELECT id FROM santri WHERE tenant_id = $1 AND nis = $2 LIMIT 1`,
      [tenantId, nis]
    );
    const existingId = existing.rows[0]?.id ?? null;

    if (existingId) {
      await pool.query(
        `DELETE FROM kesehatan_santri WHERE tenant_id = $1 AND santri_id = $2`,
        [tenantId, existingId]
      );
      await pool.query(
        `DELETE FROM pembayaran_sahriyah
         WHERE tagihan_id IN (
           SELECT id FROM tagihan_sahriyah WHERE tenant_id = $1 AND santri_id = $2
         )`,
        [tenantId, existingId]
      );
      await pool.query(
        `DELETE FROM tagihan_sahriyah WHERE tenant_id = $1 AND santri_id = $2`,
        [tenantId, existingId]
      );
      await pool.query(
        `UPDATE santri SET wali_id = NULL WHERE id = $1 AND tenant_id = $2`,
        [existingId, tenantId]
      );
      await pool.query(
        `DELETE FROM wali_santri WHERE tenant_id = $1 AND santri_id = $2`,
        [tenantId, existingId]
      );
      await pool.query(
        `DELETE FROM santri WHERE id = $1 AND tenant_id = $2`,
        [existingId, tenantId]
      );
    }

    if (tokenValue) {
      await pool.query(
        `DELETE FROM wali_push_tokens
         WHERE tenant_id = $1 AND expo_push_token = $2`,
        [tenantId, tokenValue]
      );
    }

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
       DO UPDATE SET status = 'active'
       RETURNING id`,
      [tenantId, nomorHp, `Wali ${nama}`, waliHash]
    );

    if (withToken && tokenValue) {
      await pool.query(
        `INSERT INTO wali_push_tokens (
           tenant_id, wali_akun_id, expo_push_token, device_id, platform, is_active, last_seen_at
         )
         VALUES ($1, $2, $3, $4, 'android', true, NOW())`,
        [tenantId, akunInsert.rows[0].id, tokenValue, `dev-${nis}`]
      );
    }

    const tagihanInsert = await pool.query(
      `INSERT INTO tagihan_sahriyah (
         santri_id, bulan, tahun, nominal, nominal_beras, total_bayar, sisa_tagihan,
         beras_terbayar, sisa_beras, status, tenant_id
       )
       VALUES ($1, 6, 2026, 300000, 0, 0, 300000, 0, 0, 'Belum Lunas', $2)
       RETURNING id`,
      [santriId, tenantId]
    );

    return {
      santriId,
      waliAkunId: akunInsert.rows[0].id,
      tagihanId: tagihanInsert.rows[0].id,
    };
  }

  const fixtureA = await upsertSantriWali({
    tenantId: defaultTenantId,
    nis: "SMOKE-KES-SAH-A",
    nama: "Ahmad Kes Sah",
    nomorHp: WALI_HP_A,
    tokenValue: TEST_TOKEN,
    withToken: true,
  });

  const fixtureB = await upsertSantriWali({
    tenantId: testTenantId,
    nis: "SMOKE-KES-SAH-B",
    nama: "Budi Kes Sah",
    nomorHp: WALI_HP_B,
    tokenValue: OTHER_TOKEN,
    withToken: true,
  });

  const fixtureNoToken = await upsertSantriWali({
    tenantId: defaultTenantId,
    nis: "SMOKE-KES-SAH-NOTOKEN",
    nama: "No Token Kes Sah",
    nomorHp: "08129993003",
    tokenValue: null,
    withToken: false,
  });

  await pool.query(
    `DELETE FROM notification_logs
     WHERE tenant_id = ANY($1::int[])
       AND type IN ('kesehatan', 'sahriyah')`,
    [[defaultTenantId, testTenantId]]
  );

  return { defaultTenantId, testTenantId, fixtureA, fixtureB, fixtureNoToken };
}

function checkDeepLinkHandlers() {
  const filePath = path.join(
    __dirname,
    "../wali-app/src/services/notificationNavigationService.js"
  );
  const source = fs.readFileSync(filePath, "utf8");
  return (
    source.includes("type === 'kesehatan'") &&
    source.includes("screen: 'Kesehatan'") &&
    source.includes("type === 'sahriyah'") &&
    source.includes("screen: 'Sahriyah'")
  );
}

async function main() {
  console.log("=== Smoke: Kesehatan + Sahriyah Push Notification ===\n");

  const fixtures = await ensureFixtures();
  const adminA = await loginAdmin("admin_kes_sah_a", "admin123", DEFAULT_SLUG);
  const adminB = await loginAdmin("admin_kes_sah_b", "admin123", TEST_SLUG);

  const logsKesBeforeSehat = await countLogs(
    fixtures.defaultTenantId,
    "kesehatan"
  );

  const sehat = await apiJson(adminA, "/kesehatan", {
    method: "POST",
    body: JSON.stringify({
      santri_id: fixtures.fixtureA.santriId,
      status_kesehatan: "sehat",
      status_penanganan: "observasi",
    }),
  });

  const logsKesAfterSehat = await countLogs(
    fixtures.defaultTenantId,
    "kesehatan"
  );

  if (sehat.body.success && logsKesAfterSehat === logsKesBeforeSehat) {
    ok("Create kesehatan sehat → tidak notif");
  } else {
    fail(
      "Create kesehatan sehat → tidak notif",
      `before=${logsKesBeforeSehat} after=${logsKesAfterSehat}`
    );
  }

  const logsKesBeforeSakit = await countLogs(
    fixtures.defaultTenantId,
    "kesehatan"
  );

  const sakit = await apiJson(adminA, "/kesehatan", {
    method: "POST",
    body: JSON.stringify({
      santri_id: fixtures.fixtureA.santriId,
      status_kesehatan: "sakit",
      keluhan: "Demam tinggi dan pusing berkepanjangan smoke test",
      tindakan_pertama: "Diberi paracetamol dan istirahat di klinik",
      status_penanganan: "observasi",
    }),
  });

  const logsKesAfterSakit = await countLogs(
    fixtures.defaultTenantId,
    "kesehatan"
  );

  const kesLog = await pool.query(
    `SELECT body, data
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'kesehatan'
     ORDER BY id DESC LIMIT 1`,
    [fixtures.defaultTenantId]
  );

  if (sakit.body.success && logsKesAfterSakit > logsKesBeforeSakit) {
    ok("Create kesehatan sakit → notif");
  } else {
    fail("Create kesehatan sakit → notif", JSON.stringify(sakit.body));
  }

  if (kesLog.rows[0]?.data?.type === "kesehatan") {
    ok("Payload type=kesehatan");
  } else {
    fail("Payload type=kesehatan", JSON.stringify(kesLog.rows[0]?.data));
  }

  if (
    kesLog.rows[0]?.body === "[Ahmad Kes Sah] sedang tercatat sakit." &&
    !kesLog.rows[0]?.body.includes("Demam")
  ) {
    ok("Body kesehatan aman tanpa keluhan panjang");
  } else {
    fail("Body kesehatan aman", kesLog.rows[0]?.body);
  }

  const sakitNoToken = await apiJson(adminA, "/kesehatan", {
    method: "POST",
    body: JSON.stringify({
      santri_id: fixtures.fixtureNoToken.santriId,
      status_kesehatan: "sakit",
      keluhan: "Batuk",
      tindakan_pertama: "Observasi",
      status_penanganan: "observasi",
    }),
  });

  const { rows: kesRows } = await pool.query(
    `SELECT id FROM kesehatan_santri
     WHERE tenant_id = $1 AND santri_id = $2
     ORDER BY id DESC LIMIT 1`,
    [fixtures.defaultTenantId, fixtures.fixtureNoToken.santriId]
  );

  if (sakitNoToken.body.success && kesRows.length === 1) {
    ok("Push gagal tidak rollback kesehatan");
  } else {
    fail("Push gagal tidak rollback kesehatan", JSON.stringify(sakitNoToken.body));
  }

  const logsSahBefore = await countLogs(fixtures.defaultTenantId, "sahriyah");

  const bayar = await apiJson(
    adminA,
    `/sahriyah/bayar/${fixtures.fixtureA.tagihanId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        nominal: 150000,
        beras: 0,
        petugas: "Admin Smoke",
      }),
    }
  );

  const logsSahAfter = await countLogs(fixtures.defaultTenantId, "sahriyah");

  const sahLog = await pool.query(
    `SELECT body, data
     FROM notification_logs
     WHERE tenant_id = $1 AND type = 'sahriyah'
     ORDER BY id DESC LIMIT 1`,
    [fixtures.defaultTenantId]
  );

  if (bayar.body.success && logsSahAfter > logsSahBefore) {
    ok("Bayar sahriyah → notif");
  } else {
    fail("Bayar sahriyah → notif", JSON.stringify(bayar.body));
  }

  if (
    sahLog.rows[0]?.data?.type === "sahriyah" &&
    Number(sahLog.rows[0]?.data?.tagihan_id) === fixtures.fixtureA.tagihanId &&
    Number(sahLog.rows[0]?.data?.santri_id) === fixtures.fixtureA.santriId
  ) {
    ok("Payload type=sahriyah + tagihan_id");
  } else {
    fail("Payload type=sahriyah + tagihan_id", JSON.stringify(sahLog.rows[0]?.data));
  }

  const bayarNoToken = await apiJson(
    adminA,
    `/sahriyah/bayar/${fixtures.fixtureNoToken.tagihanId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        nominal: 50000,
        beras: 0,
        petugas: "Admin Smoke",
      }),
    }
  );

  const { rows: payRows } = await pool.query(
    `SELECT id FROM pembayaran_sahriyah
     WHERE tagihan_id = $1 AND tenant_id = $2
     ORDER BY id DESC LIMIT 1`,
    [fixtures.fixtureNoToken.tagihanId, fixtures.defaultTenantId]
  );

  if (bayarNoToken.body.success && payRows.length === 1) {
    ok("Push gagal tidak rollback pembayaran");
  } else {
    fail(
      "Push gagal tidak rollback pembayaran",
      JSON.stringify(bayarNoToken.body)
    );
  }

  const logsBeforeB = await countLogs(fixtures.testTenantId, "sahriyah");
  const logsBeforeA = await countLogs(fixtures.defaultTenantId, "sahriyah");

  await apiJson(adminB, `/sahriyah/bayar/${fixtures.fixtureB.tagihanId}`, {
    method: "PUT",
    body: JSON.stringify({
      nominal: 100000,
      beras: 0,
      petugas: "Admin B",
    }),
  });

  const logsAfterB = await countLogs(fixtures.testTenantId, "sahriyah");
  const logsAfterA = await countLogs(fixtures.defaultTenantId, "sahriyah");

  const { rows: crossLeak } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notification_logs
     WHERE tenant_id = $1
       AND type = 'sahriyah'
       AND wali_akun_id = $2
       AND created_at > NOW() - INTERVAL '5 minutes'`,
    [fixtures.defaultTenantId, fixtures.fixtureB.waliAkunId]
  );

  if (
    logsAfterB > logsBeforeB &&
    crossLeak[0].total === 0 &&
    logsAfterA === logsBeforeA
  ) {
    ok("Tenant isolation aman");
  } else {
    fail(
      "Tenant isolation aman",
      `A=${logsAfterA}/${logsBeforeA} B=${logsAfterB}/${logsBeforeB} leak=${crossLeak[0].total}`
    );
  }

  if (checkDeepLinkHandlers()) {
    ok("Deep link handler ada");
  } else {
    fail("Deep link handler ada", "handler kesehatan/sahriyah tidak ditemukan");
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
