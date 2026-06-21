/**
 * Smoke test — Step 2A tenant isolation (core master data)
 * Usage: node scripts/smoke-step2a-tenant-isolation.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3001";
const DEFAULT_SLUG = "default";
const TEST_SLUG = "tenant-test-2a";

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
  const { res, body } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: tenantSlug }),
  });
  if (!body.token) {
    throw new Error(`Login failed ${username}@${tenantSlug}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function ensureFixtures() {
  const { rows: defaultTenant } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [DEFAULT_SLUG]
  );
  if (!defaultTenant.length) throw new Error("default tenant missing");

  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Pesantren Test 2A', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );

  const { rows: testTenant } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );
  const testTenantId = testTenant[0].id;

  const hash = await bcrypt.hash("test1234", 10);

  await pool.query(
    `INSERT INTO users (nama, username, password, role, status, tenant_id)
     VALUES ('Admin Test 2A', 'admin_test_2a', $1, 'superadmin', 'Aktif', $2)
     ON CONFLICT DO NOTHING`,
    [hash, testTenantId]
  );

  // users.username may be globally unique — use upsert by check
  const existing = await pool.query(
    `SELECT id FROM users WHERE username = 'admin_test_2a' AND tenant_id = $1`,
    [testTenantId]
  );
  if (!existing.rows.length) {
    await pool.query(
      `INSERT INTO users (nama, username, password, role, status, tenant_id)
       VALUES ('Admin Test 2A', 'admin_test_2a', $1, 'superadmin', 'Aktif', $2)`,
      [hash, testTenantId]
    );
  }

  await pool.query(
    `DELETE FROM kelas WHERE tenant_id = $1 AND nama_kelas LIKE 'SMOKE-2A-%'`,
    [testTenantId]
  );

  await pool.query(
    `INSERT INTO kelas (nama_kelas, tenant_id)
     VALUES ('SMOKE-2A-TEST-KELAS', $1)`,
    [testTenantId]
  );

  return { defaultTenantId: defaultTenant[0].id, testTenantId };
}

async function run() {
  console.log("=== Smoke: Step 2A Tenant Isolation ===\n");

  const { defaultTenantId, testTenantId } = await ensureFixtures();
  ok(`Fixtures ready (default=${defaultTenantId}, test=${testTenantId})`);

  const defaultAuth = await login("admin", "admin123", DEFAULT_SLUG);
  const testAuth = await login("admin_test_2a", "test1234", TEST_SLUG);

  const hDefault = { Authorization: `Bearer ${defaultAuth.token}` };
  const hTest = { Authorization: `Bearer ${testAuth.token}` };

  const kelasDefault = await fetchJson("/kelas", { headers: hDefault });
  const kelasTest = await fetchJson("/kelas", { headers: hTest });

  if (kelasDefault.res.status !== 200 || kelasTest.res.status !== 200) {
    fail("GET /kelas both tenants", { kelasDefault, kelasTest });
  } else {
    const defaultNames = (kelasDefault.body.data || []).map((k) => k.nama_kelas);
    const testNames = (kelasTest.body.data || []).map((k) => k.nama_kelas);

    const defaultSeesTest = defaultNames.some((n) => n.startsWith("SMOKE-2A-"));
    const testSeesDefaultOnly = testNames.every((n) => n.startsWith("SMOKE-2A-"));

    if (!defaultSeesTest) ok("Default tenant tidak lihat kelas SMOKE-2A test");
    else fail("Default tenant tidak lihat kelas SMOKE-2A test", defaultNames);

    if (testSeesDefaultOnly && testNames.length >= 1) {
      ok("Test tenant hanya lihat kelas miliknya (SMOKE-2A)");
    } else {
      fail("Test tenant hanya lihat kelas miliknya", testNames);
    }
  }

  const santriDefault = await fetchJson("/santri", { headers: hDefault });
  const santriTest = await fetchJson("/santri", { headers: hTest });

  if (santriDefault.res.status === 200 && santriTest.res.status === 200) {
    const allDefaultTenant = (santriDefault.body.data || []).every(
      (s) => s.tenant_id === defaultTenantId
    );
    const allTestTenant = (santriTest.body.data || []).every(
      (s) => s.tenant_id === testTenantId
    );
    const defaultIds = new Set((santriDefault.body.data || []).map((s) => s.id));
    const testIds = new Set((santriTest.body.data || []).map((s) => s.id));
    const overlap = [...defaultIds].filter((id) => testIds.has(id));

    if (allDefaultTenant) ok("GET /santri default — semua row tenant default");
    else fail("GET /santri default tenant_id", santriDefault.body.data?.slice(0, 2));

    if (allTestTenant) ok("GET /santri test — semua row tenant test");
    else fail("GET /santri test tenant_id", santriTest.body.data);

    if (overlap.length === 0) ok("Tidak ada overlap santri id antar tenant");
    else fail("Overlap santri id antar tenant", overlap);
  } else {
    fail("GET /santri", { santriDefault: santriDefault.body, santriTest: santriTest.body });
  }

  const guruDefault = await fetchJson("/guru", { headers: hDefault });
  const guruTest = await fetchJson("/guru", { headers: hTest });

  if (guruDefault.res.status === 200 && guruTest.res.status === 200) {
    const gOverlap =
      (guruDefault.body.data || []).some((g) => g.tenant_id === testTenantId) ||
      (guruTest.body.data || []).some((g) => g.tenant_id === defaultTenantId);
    if (!gOverlap) ok("GET /guru — isolasi antar tenant");
    else fail("GET /guru — bocor antar tenant");
  } else {
    fail("GET /guru", { guruDefault: guruDefault.body, guruTest: guruTest.body });
  }

  const waliDefault = await fetchJson("/wali", { headers: hDefault });
  const waliTest = await fetchJson("/wali", { headers: hTest });

  if (waliDefault.res.status === 200 && waliTest.res.status === 200) {
    const wDefaultIds = new Set((waliDefault.body.data || []).map((w) => w.id));
    const wTestIds = new Set((waliTest.body.data || []).map((w) => w.id));
    const wOverlap = [...wDefaultIds].filter((id) => wTestIds.has(id));
    if (wOverlap.length === 0) ok("GET /wali — tidak ada overlap wali id antar tenant");
    else fail("GET /wali overlap", wOverlap);
  } else {
    fail("GET /wali", { waliDefault: waliDefault.body, waliTest: waliTest.body });
  }

  // Cross-tenant kelas_id rejected on santri create
  const { rows: testKelas } = await pool.query(
    `SELECT id FROM kelas WHERE tenant_id = $1 AND nama_kelas LIKE 'SMOKE-2A-%' LIMIT 1`,
    [testTenantId]
  );
  if (testKelas.length) {
    const cross = await fetchJson("/santri", {
      method: "POST",
      headers: { ...hDefault, "Content-Type": "application/json" },
      body: JSON.stringify({
        nis: `CROSS-${Date.now()}`,
        nama: "Cross Tenant Fail",
        kelas_id: testKelas[0].id,
        uid_rfid: "",
        alamat: "",
        orang_tua: "",
        nomor_hp_ortu: "",
        foto: "",
      }),
    });
    if (cross.res.status === 400) ok("POST /santri menolak kelas_id tenant lain");
    else fail("POST /santri cross-tenant kelas_id", cross.body);
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
