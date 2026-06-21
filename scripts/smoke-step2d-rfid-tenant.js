/**
 * Smoke test — Step 2D RFID tenant isolation
 * Usage: node scripts/smoke-step2d-rfid-tenant.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3013";
const SLUG_A = "tenant-test-2d-a";
const SLUG_B = "tenant-test-2d-b";
const SHARED_UID = "SMOKE2DUID01";
const DEVICE_ID = "SMOKE-DEV-01";
const RUN_ID = Date.now();

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

async function adminLogin(username, password, tenantSlug) {
  const { body } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: tenantSlug }),
  });
  if (!body.token) throw new Error(`Login fail ${username}@${tenantSlug}`);
  return body.token;
}

async function devicePayment(tenantSlug, deviceSecret, uid, trxId, nominal = 5000) {
  return fetchJson("/rfid/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: tenantSlug,
      device_id: DEVICE_ID,
      device_secret: deviceSecret,
      uid_rfid: uid,
      nominal,
      trx_id: trxId,
      override_limit: true,
    }),
  });
}

async function ensureFixtures() {
  const hash = await bcrypt.hash("test1234", 10);

  for (const [slug, name] of [
    [SLUG_A, "Test 2D A"],
    [SLUG_B, "Test 2D B"],
  ]) {
    await pool.query(
      `INSERT INTO tenants (slug, nama, status) VALUES ($1, $2, 'active')
       ON CONFLICT (slug) DO NOTHING`,
      [slug, name]
    );
  }

  const { rows: tA } = await pool.query(`SELECT id FROM tenants WHERE slug = $1`, [SLUG_A]);
  const { rows: tB } = await pool.query(`SELECT id FROM tenants WHERE slug = $1`, [SLUG_B]);
  const tenantA = tA[0].id;
  const tenantB = tB[0].id;

  async function upsertAdmin(username, tenantId) {
    const ex = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    if (!ex.rows.length) {
      await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, 'superadmin', 'Aktif', $4)`,
        [username, username, hash, tenantId]
      );
    } else {
      await pool.query(
        `UPDATE users SET tenant_id = $1, password = $2, role = 'superadmin' WHERE username = $3`,
        [tenantId, hash, username]
      );
    }
  }

  await upsertAdmin("admin_test_2da", tenantA);
  await upsertAdmin("admin_test_2db", tenantB);

  async function upsertSantri(tenantId, nis) {
    let kelasId;
    const k = await pool.query(
      `SELECT id FROM kelas WHERE tenant_id = $1 AND nama_kelas = 'SMOKE-2D' LIMIT 1`,
      [tenantId]
    );
    if (!k.rows.length) {
      const ins = await pool.query(
        `INSERT INTO kelas (nama_kelas, tenant_id) VALUES ('SMOKE-2D', $1) RETURNING id`,
        [tenantId]
      );
      kelasId = ins.rows[0].id;
    } else kelasId = k.rows[0].id;

    const ex = await pool.query(
      `SELECT id, saldo FROM santri WHERE tenant_id = $1 AND nis = $2`,
      [tenantId, nis]
    );
    if (!ex.rows.length) {
      const ins = await pool.query(
        `INSERT INTO santri (nis, nama, uid_rfid, saldo, limit_harian, kelas_id, tenant_id)
         VALUES ($1, $2, $3, 100000, 999999, $4, $5) RETURNING id, saldo`,
        [nis, `Santri ${nis}`, SHARED_UID, kelasId, tenantId]
      );
      return ins.rows[0];
    }
    await pool.query(
      `UPDATE santri SET uid_rfid = $1, saldo = 100000, limit_harian = 999999 WHERE id = $2`,
      [SHARED_UID, ex.rows[0].id]
    );
    return { id: ex.rows[0].id, saldo: 100000 };
  }

  const santriA = await upsertSantri(tenantA, "SMOKE-2D-A");
  const santriB = await upsertSantri(tenantB, "SMOKE-2D-B");

  async function provisionDevice(token, merchantId) {
    await pool.query(
      `DELETE FROM transaksi_rfid WHERE tenant_id = (
         SELECT tenant_id FROM devices WHERE device_id = $1 AND tenant_id IN ($2, $3) LIMIT 1
       ) AND trx_id LIKE 'SMOKE-2D-%'`,
      [DEVICE_ID, tenantA, tenantB]
    ).catch(() => {});

    const { res, body } = await fetchJson("/rfid/device/provision", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id: DEVICE_ID,
        nama_device: "Smoke Device",
        merchant_id: merchantId,
      }),
    });

    if (res.status === 409) {
      const dev = await pool.query(
        `SELECT device_secret FROM devices WHERE tenant_id = (
           SELECT id FROM tenants WHERE slug = $1
         ) AND device_id = $2`,
        [token === (await adminLogin("admin_test_2da", "test1234", SLUG_A)) ? SLUG_A : SLUG_B, DEVICE_ID]
      );
      return dev.rows[0]?.device_secret;
    }

    if (res.status !== 201) {
      throw new Error(`Provision fail: ${res.status} ${JSON.stringify(body)}`);
    }
    return body.device_secret;
  }

  async function ensureMerchant(token, tenantId) {
    const ex = await pool.query(
      `SELECT id FROM merchant_rfid WHERE tenant_id = $1 AND nama_merchant = 'SMOKE-MERCHANT'`,
      [tenantId]
    );
    if (ex.rows.length) return ex.rows[0].id;

    const { body } = await fetchJson("/rfid/merchant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nama_merchant: "SMOKE-MERCHANT" }),
    });
    return body.data?.id;
  }

  const tokenA = await adminLogin("admin_test_2da", "test1234", SLUG_A);
  const tokenB = await adminLogin("admin_test_2db", "test1234", SLUG_B);

  const merchantA = await ensureMerchant(tokenA, tenantA);
  const merchantB = await ensureMerchant(tokenB, tenantB);

  await pool.query(
    `UPDATE santri SET saldo = 100000, limit_harian = 999999
     WHERE tenant_id IN ($1, $2) AND uid_rfid = $3`,
    [tenantA, tenantB, SHARED_UID]
  );

  await pool.query(`DELETE FROM devices WHERE device_id = $1 AND tenant_id IN ($2, $3)`, [
    DEVICE_ID,
    tenantA,
    tenantB,
  ]);
  const secretA = (
    await fetchJson("/rfid/device/provision", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}`, "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: DEVICE_ID, nama_device: "Dev A", merchant_id: merchantA }),
    })
  ).body.device_secret;

  const secretB = (
    await fetchJson("/rfid/device/provision", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}`, "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: DEVICE_ID, nama_device: "Dev B", merchant_id: merchantB }),
    })
  ).body.device_secret;

  return {
    tenantA,
    tenantB,
    tokenA,
    tokenB,
    secretA,
    secretB,
    santriA,
    santriB,
    merchantA,
    merchantB,
  };
}

async function getSaldo(tenantId, uid) {
  const { rows } = await pool.query(
    `SELECT saldo FROM santri WHERE tenant_id = $1 AND uid_rfid = $2`,
    [tenantId, uid]
  );
  return Number(rows[0]?.saldo || 0);
}

async function run() {
  console.log(`Smoke Step 2D — ${BASE}\n`);

  const fx = await ensureFixtures();

  await pool.query(
    `UPDATE santri SET saldo = 100000 WHERE tenant_id IN ($1, $2) AND uid_rfid = $3`,
    [fx.tenantA, fx.tenantB, SHARED_UID]
  );

  await pool.query(
    `DELETE FROM transaksi_rfid WHERE tenant_id IN ($1, $2) AND trx_id LIKE 'SMOKE-2D-%'`,
    [fx.tenantA, fx.tenantB]
  );

  const saldoBeforeA = await getSaldo(fx.tenantA, SHARED_UID);
  const saldoBeforeB = await getSaldo(fx.tenantB, SHARED_UID);

  if (saldoBeforeA >= 100000 && saldoBeforeB >= 100000) {
    ok("Tenant A dan B punya UID RFID sama");
  } else fail("UID setup", { saldoBeforeA, saldoBeforeB });

  const payA = await devicePayment(SLUG_A, fx.secretA, SHARED_UID, `SMOKE-2D-PAY-A-${RUN_ID}`, 5000);
  if (payA.body.success && payA.body.saldo_sekarang === saldoBeforeA - 5000) {
    ok("Device tenant A bayar UID → debit santri A");
  } else fail("Payment tenant A", payA.body);

  const payB = await devicePayment(SLUG_B, fx.secretB, SHARED_UID, `SMOKE-2D-PAY-B-${RUN_ID}`, 3000);
  if (payB.body.success && payB.body.saldo_sekarang === saldoBeforeB - 3000) {
    ok("Device tenant B bayar UID → debit santri B");
  } else fail("Payment tenant B", payB.body);

  const crossSecret = await devicePayment(SLUG_A, fx.secretB, SHARED_UID, `SMOKE-2D-CROSS-${RUN_ID}`, 1000);
  if (crossSecret.res.status === 401) {
    ok("Device tenant A tidak bisa pakai secret tenant B");
  } else fail("Cross secret", crossSecret.res.status);

  const crossMerchant = await fetchJson("/rfid/device/assign", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${fx.tokenA}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_id: DEVICE_ID, merchant_id: fx.merchantB }),
  });
  if (crossMerchant.res.status === 400) {
    ok("Merchant tenant B tidak bisa diassign ke device tenant A");
  } else fail("Cross merchant assign", crossMerchant.body);

  const dupId = `SMOKE-2D-DUP-GLOBAL-${RUN_ID}`;
  const dupGlobalA = await devicePayment(SLUG_A, fx.secretA, SHARED_UID, dupId, 1000);
  const dupGlobalB = await devicePayment(SLUG_B, fx.secretB, SHARED_UID, dupId, 1000);
  if (dupGlobalA.body.success && dupGlobalB.body.success) {
    ok("trx_id sama di tenant A dan B boleh");
  } else fail("trx_id cross tenant", { dupGlobalA: dupGlobalA.body, dupGlobalB: dupGlobalB.body });

  const dupSameId = `SMOKE-2D-DUP-SAME-${RUN_ID}`;
  const dupSame = await devicePayment(SLUG_A, fx.secretA, SHARED_UID, dupSameId, 1000);
  const dupSame2 = await devicePayment(SLUG_A, fx.secretA, SHARED_UID, dupSameId, 1000);
  if (dupSame.body.success && dupSame2.body.message === "Duplicate ignored") {
    ok("trx_id sama dalam tenant dianggap duplicate");
  } else fail("duplicate same tenant", dupSame2.body);

  const saldoBBeforeSync = await getSaldo(fx.tenantB, SHARED_UID);
  const saldoABeforeSync = await getSaldo(fx.tenantA, SHARED_UID);

  const syncB = await fetchJson("/rfid/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: SLUG_B,
      device_id: DEVICE_ID,
      device_secret: fx.secretB,
      transactions: [{ uid_rfid: SHARED_UID, nominal: 2000, trx_id: `SMOKE-2D-SYNC-B-${RUN_ID}` }],
    }),
  });

  const saldoAfterSyncB = await getSaldo(fx.tenantB, SHARED_UID);
  const saldoAfterSyncA = await getSaldo(fx.tenantA, SHARED_UID);

  if (
    syncB.body.success &&
    saldoAfterSyncB === saldoBBeforeSync - 2000 &&
    saldoAfterSyncA === saldoABeforeSync
  ) {
    ok("Sync offline tenant B tidak masuk tenant A");
  } else {
    fail("Sync isolation", {
      syncB: syncB.body,
      saldoABeforeSync,
      saldoAfterSyncA,
      saldoBBeforeSync,
      saldoAfterSyncB,
    });
  }

  const saldoBeforeTopup = await getSaldo(fx.tenantA, SHARED_UID);
  const topup = await fetchJson("/rfid/topup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fx.tokenA}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      santri_id: fx.santriA.id,
      nominal: 15000,
      user_id: 1,
    }),
  });
  const kasCheck = await pool.query(
    `SELECT COUNT(*)::int AS n FROM buku_kas
     WHERE tenant_id = $1 AND keterangan = $2 AND nominal = 15000`,
    [fx.tenantA, fx.santriA.id ? (await pool.query(`SELECT nama FROM santri WHERE id=$1`, [fx.santriA.id])).rows[0].nama : ""]
  );
  const saldoAfterTopup = await getSaldo(fx.tenantA, SHARED_UID);
  if (topup.body.success && saldoAfterTopup === saldoBeforeTopup + 15000 && kasCheck.rows[0].n >= 1) {
    ok("Topup tenant A → saldo A + buku_kas tenant A");
  } else fail("Topup tenant A", { topup: topup.body, saldoAfterTopup, kas: kasCheck.rows[0] });

  const trxB = await pool.query(
    `SELECT id FROM transaksi_rfid WHERE tenant_id = $1 LIMIT 1`,
    [fx.tenantB]
  );
  if (trxB.rows.length) {
    const refundCross = await fetchJson("/rfid/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fx.tokenA}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaksi_id: trxB.rows[0].id }),
    });
    if (refundCross.res.status >= 400 || refundCross.body.success === false) {
      ok("Refund cross-tenant ditolak");
    } else fail("Refund cross-tenant", refundCross.body);
  } else fail("Refund cross-tenant setup", "no trx B");

  const dashA = await fetchJson("/rfid/dashboard", {
    headers: { Authorization: `Bearer ${fx.tokenA}` },
  });
  const dashB = await fetchJson("/rfid/dashboard", {
    headers: { Authorization: `Bearer ${fx.tokenB}` },
  });
  if (
    dashA.res.status === 200 &&
    dashB.res.status === 200 &&
    Number(dashA.body.kartu_aktif) <= 10 &&
    Number(dashB.body.kartu_aktif) <= 10
  ) {
    ok("Dashboard RFID tenant-scoped (kartu_aktif kecil per tenant)");
  } else fail("Dashboard scoped", { dashA: dashA.body, dashB: dashB.body });

  const noTokenRfid = await fetchJson(`/santri/rfid/${SHARED_UID}`);
  if (noTokenRfid.res.status === 401) ok("GET /santri/rfid/:uid tanpa token ditolak");
  else fail("GET santri rfid no token", noTokenRfid.res.status);

  const noTokenTrx = await fetchJson("/rfid/transactions");
  if (noTokenTrx.res.status === 401) ok("GET /rfid/transactions tanpa token ditolak");
  else fail("GET transactions no token", noTokenTrx.res.status);

  const defaultToken = await adminLogin("admin", "admin123", "default");
  const defaultPay = await fetchJson("/rfid/dashboard", {
    headers: { Authorization: `Bearer ${defaultToken}` },
  });
  if (defaultPay.res.status === 200) ok("Regression default tenant dashboard OK");
  else fail("Regression default", defaultPay.body);

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("ERR", err);
  await pool.end();
  process.exit(1);
});
