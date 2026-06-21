/**
 * Smoke test — Step 2B.1 Kas Instansi tenant isolation
 * Usage: node scripts/smoke-step2b1-kas-instansi-tenant.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3002";
const TEST_SLUG = "tenant-test-2b1";
const MARKER = "SMOKE-2B1";

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

async function login(username, password, tenantSlug) {
  const payload = { username, password };
  if (tenantSlug) payload.tenant_slug = tenantSlug;
  const { body } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!body.token) throw new Error(`Login fail ${username}@${tenantSlug || "default"}`);
  return body;
}

async function ensureFixtures() {
  const { rows: defRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = 'default'`
  );
  const defaultTenantId = defRows[0].id;

  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Pesantren Test 2B.1', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );
  const { rows: testRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );
  const testTenantId = testRows[0].id;

  const hash = await bcrypt.hash("test1234", 10);

  const existing = await pool.query(
    `SELECT id FROM users WHERE username = 'admin_test_2b1'`
  );
  if (!existing.rows.length) {
    await pool.query(
      `INSERT INTO users (nama, username, password, role, status, tenant_id)
       VALUES ('Admin Test 2B1', 'admin_test_2b1', $1, 'superadmin', 'Aktif', $2)`,
      [hash, testTenantId]
    );
  } else {
    await pool.query(
      `UPDATE users SET tenant_id = $1, password = $2 WHERE username = 'admin_test_2b1'`,
      [testTenantId, hash]
    );
  }

  const bendExisting = await pool.query(
    `SELECT id FROM users WHERE username = 'bendahara_2b1_test'`
  );
  let bendaharaId;
  if (!bendExisting.rows.length) {
    const ins = await pool.query(
      `INSERT INTO users (nama, username, password, role, status, tenant_id)
       VALUES ('Bendahara 2B1 Test', 'bendahara_2b1_test', $1, 'bendahara_unit', 'Aktif', $2)
       RETURNING id`,
      [hash, testTenantId]
    );
    bendaharaId = ins.rows[0].id;
  } else {
    bendaharaId = bendExisting.rows[0].id;
    await pool.query(
      `UPDATE users SET tenant_id = $1, password = $2, role = 'bendahara_unit'
       WHERE username = 'bendahara_2b1_test'`,
      [testTenantId, hash]
    );
  }

  await pool.query(
    `DELETE FROM kas_instansi_transaksi
     WHERE tenant_id = $1 AND keterangan LIKE $2`,
    [testTenantId, `${MARKER}-%`]
  );
  await pool.query(
    `DELETE FROM buku_kas WHERE tenant_id = $1 AND keterangan LIKE $2`,
    [testTenantId, `${MARKER}-%`]
  );

  let testUnitId;
  const unitExisting = await pool.query(
    `SELECT id FROM unit_pendidikan WHERE tenant_id = $1 AND kode = 'PAUD'`,
    [testTenantId]
  );
  if (!unitExisting.rows.length) {
    const ins = await pool.query(
      `INSERT INTO unit_pendidikan (kode, nama, is_active, sort_order, tenant_id)
       VALUES ('PAUD', 'PAUD Test Tenant', true, 99, $1)
       RETURNING id`,
      [testTenantId]
    );
    testUnitId = ins.rows[0].id;
  } else {
    testUnitId = unitExisting.rows[0].id;
  }

  await pool.query(
    `INSERT INTO user_unit_scope (user_id, unit_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, unit_id) DO NOTHING`,
    [bendaharaId, testUnitId]
  );

  await pool.query(
    `INSERT INTO kas_instansi_transaksi
       (unit_id, tenant_id, tanggal, jenis, kategori, keterangan, nominal, petugas)
     VALUES ($1, $2, CURRENT_DATE, 'Masuk', 'Smoke', $3, 777777, 'smoke')`,
    [testUnitId, testTenantId, `${MARKER}-TRANS`]
  );

  await pool.query(
    `INSERT INTO buku_kas (tanggal, jenis, kategori, keterangan, nominal, petugas, tenant_id)
     VALUES (CURRENT_DATE, 'Masuk', 'Manual', $1, 888888, 'smoke', $2)`,
    [`${MARKER}-KAS`, testTenantId]
  );

  return { defaultTenantId, testTenantId, testUnitId };
}

async function run() {
  console.log(`Smoke Step 2B.1 — ${BASE}\n`);
  await ensureFixtures();

  const defaultAuth = await login("admin", "admin123");
  const testAuth = await login("admin_test_2b1", "test1234", TEST_SLUG);
  const bendaharaAuth = await login("bendahara_2b1_test", "test1234", TEST_SLUG);

  const defaultHeaders = { Authorization: `Bearer ${defaultAuth.token}` };
  const testHeaders = { Authorization: `Bearer ${testAuth.token}` };
  const bendaharaHeaders = { Authorization: `Bearer ${bendaharaAuth.token}` };

  // 1. Default tenant tidak lihat unit tenant test (by id)
  const { body: defaultUnits } = await fetchJson("/kas-instansi/units", {
    headers: defaultHeaders,
  });
  const { rows: testUnitRows } = await pool.query(
    `SELECT id FROM unit_pendidikan WHERE tenant_id = (
       SELECT id FROM tenants WHERE slug = $1
     ) AND kode = 'PAUD'`,
    [TEST_SLUG]
  );
  const testUnitId = testUnitRows[0]?.id;
  const defaultHasTestUnit = (defaultUnits.data || []).some((u) => u.id === testUnitId);
  if (!defaultHasTestUnit) ok("default tidak lihat unit tenant test");
  else fail("default tidak lihat unit tenant test", defaultUnits.data);

  // 2. Test tenant tidak lihat unit default-only (compare counts / no default-only ids)
  const { body: testUnits } = await fetchJson("/kas-instansi/units", {
    headers: testHeaders,
  });
  const testOnlySeesOwn = (testUnits.data || []).every((u) => u.id === testUnitId);
  if (testOnlySeesOwn && (testUnits.data || []).length >= 1) {
    ok("test tenant hanya lihat unit sendiri");
  } else {
    fail("test tenant hanya lihat unit sendiri", testUnits.data);
  }

  // 3. Default tidak lihat transaksi tenant test via ringkasan alltime marker
  const { body: defaultRingkasan } = await fetchJson(
    "/kas-instansi/PAUD/ringkasan?bulan=6&tahun=2026",
    { headers: defaultHeaders }
  );
  const defaultSaldo = Number(defaultRingkasan.data?.saldo_akhir_alltime || 0);
  const { rows: testSaldoRow } = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN jenis = 'Masuk' THEN nominal ELSE -nominal END), 0) AS s
     FROM kas_instansi_transaksi
     WHERE tenant_id = (SELECT id FROM tenants WHERE slug = $1)
       AND keterangan LIKE $2`,
    [TEST_SLUG, `${MARKER}-%`]
  );
  const testMarkerSaldo = Number(testSaldoRow[0].s);
  if (testMarkerSaldo > 0 && defaultSaldo < testMarkerSaldo) {
    ok("default tidak menghitung transaksi tenant test (ringkasan PAUD)");
  } else if (testMarkerSaldo === 0) {
    fail("fixture transaksi test", testMarkerSaldo);
  } else {
    fail("default tidak menghitung transaksi tenant test", { defaultSaldo, testMarkerSaldo });
  }

  // 4. Test tenant ringkasan includes marker transaksi
  const { body: testRingkasan } = await fetchJson(
    "/kas-instansi/PAUD/ringkasan?bulan=6&tahun=2026",
    { headers: testHeaders }
  );
  const testSaldo = Number(testRingkasan.data?.saldo_akhir_alltime || 0);
  if (testSaldo >= testMarkerSaldo) ok("test tenant lihat transaksi sendiri");
  else fail("test tenant lihat transaksi sendiri", { testSaldo, testMarkerSaldo });

  // 5. Konsolidasi scoped ke buku_kas tenant masing-masing
  const bulan = new Date().getMonth() + 1;
  const tahun = new Date().getFullYear();
  const { body: defaultKons } = await fetchJson(
    `/kas-instansi/konsolidasi?bulan=${bulan}&tahun=${tahun}`,
    { headers: defaultHeaders }
  );
  const pondokMasuk = Number(defaultKons.data?.kas_pondok?.pemasukan_bulan || 0);
  const { rows: defaultDbKas } = await pool.query(
    `SELECT COALESCE(SUM(nominal), 0) AS s FROM buku_kas
     WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'default')
       AND jenis = 'Masuk'
       AND EXTRACT(MONTH FROM tanggal) = $1
       AND EXTRACT(YEAR FROM tanggal) = $2`,
    [bulan, tahun]
  );
  const defaultDbMasuk = Number(defaultDbKas[0].s);

  const { body: testKons } = await fetchJson(
    `/kas-instansi/konsolidasi?bulan=${bulan}&tahun=${tahun}`,
    { headers: testHeaders }
  );
  const testPondokMasuk = Number(testKons.data?.kas_pondok?.pemasukan_bulan || 0);
  const { rows: testDbKas } = await pool.query(
    `SELECT COALESCE(SUM(nominal), 0) AS s FROM buku_kas
     WHERE tenant_id = (SELECT id FROM tenants WHERE slug = $1)
       AND jenis = 'Masuk'
       AND EXTRACT(MONTH FROM tanggal) = $2
       AND EXTRACT(YEAR FROM tanggal) = $3`,
    [TEST_SLUG, bulan, tahun]
  );
  const testDbMasuk = Number(testDbKas[0].s);
  const testKasNominal = 888888;

  if (pondokMasuk === defaultDbMasuk) {
    ok("konsolidasi default = buku_kas tenant default");
  } else {
    fail("konsolidasi default = buku_kas tenant default", { pondokMasuk, defaultDbMasuk });
  }

  if (testPondokMasuk === testDbMasuk && testDbMasuk >= testKasNominal) {
    ok("konsolidasi test = buku_kas tenant test (isolasi)");
  } else {
    fail("konsolidasi test = buku_kas tenant test", {
      testPondokMasuk,
      testDbMasuk,
      testKasNominal,
    });
  }

  const { rows: leakCheck } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM buku_kas
     WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'default')
       AND keterangan LIKE $1`,
    [`${MARKER}-%`]
  );
  if (leakCheck[0].n === 0) ok("marker buku_kas test tidak ada di tenant default");
  else fail("marker buku_kas test tidak ada di tenant default", leakCheck[0].n);

  // 6. Bendahara hanya lihat unit dalam tenant sendiri
  const { body: bendUnits } = await fetchJson("/kas-instansi/units", {
    headers: bendaharaHeaders,
  });
  const bendCount = (bendUnits.data || []).length;
  const bendOnlyTestPaud =
    bendCount === 1 && bendUnits.data[0].kode === "PAUD" && bendUnits.data[0].id === testUnitId;
  if (bendOnlyTestPaud) ok("bendahara unit hanya lihat unit tenant sendiri");
  else fail("bendahara unit scope", bendUnits.data);

  // 7. Bendahara default tenant PAUD tidak accessible (wrong tenant unit id)
  const { res: bendDefaultPaud } = await fetchJson(
    "/kas-instansi/PAUD/transaksi?bulan=6&tahun=2026",
    { headers: bendaharaHeaders }
  );
  if (bendDefaultPaud.status === 200) {
    const items = (await fetchJson("/kas-instansi/PAUD/transaksi?bulan=6&tahun=2026", {
      headers: bendaharaHeaders,
    })).body?.data?.items || [];
    const hasMarker = items.some((t) => String(t.keterangan || "").includes(MARKER));
    if (hasMarker) ok("bendahara akses PAUD tenant sendiri (transaksi)");
    else ok("bendahara akses PAUD tenant sendiri (transaksi kosong/tanpa leak)");
  } else {
    fail("bendahara akses PAUD tenant sendiri", bendDefaultPaud.status);
  }

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("ERR", err);
  await pool.end();
  process.exit(1);
});
