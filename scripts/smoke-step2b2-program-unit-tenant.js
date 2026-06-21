/**
 * Smoke test — Step 2B.2 Program Unit tenant isolation
 * Usage: node scripts/smoke-step2b2-program-unit-tenant.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3010";
const TEST_SLUG = "tenant-test-2b2";
const MARKER = "SMOKE-2B2";

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
  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Pesantren Test 2B2', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );
  const { rows: testRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );
  const testTenantId = testRows[0].id;
  const hash = await bcrypt.hash("test1234", 10);

  async function upsertUser(username, nama, role) {
    const ex = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    if (!ex.rows.length) {
      const ins = await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, $4, 'Aktif', $5) RETURNING id`,
        [nama, username, hash, role, testTenantId]
      );
      return ins.rows[0].id;
    }
    await pool.query(
      `UPDATE users SET tenant_id = $1, password = $2, role = $3 WHERE username = $4`,
      [testTenantId, hash, role, username]
    );
    return ex.rows[0].id;
  }

  const adminId = await upsertUser("admin_test_2b2", "Admin Test 2B2", "superadmin");
  const pimpinanId = await upsertUser("pimpinan_test_2b2", "Pimpinan Test 2B2", "pimpinan_yayasan");
  const bendaharaId = await upsertUser("bendahara_2b2_test", "Bendahara 2B2", "bendahara_unit");

  let unitId;
  const unitEx = await pool.query(
    `SELECT id FROM unit_pendidikan WHERE tenant_id = $1 AND kode = 'PAUD'`,
    [testTenantId]
  );
  if (!unitEx.rows.length) {
    const ins = await pool.query(
      `INSERT INTO unit_pendidikan (kode, nama, is_active, sort_order, tenant_id)
       VALUES ('PAUD', 'PAUD Test 2B2', true, 99, $1) RETURNING id`,
      [testTenantId]
    );
    unitId = ins.rows[0].id;
  } else {
    unitId = unitEx.rows[0].id;
  }

  await pool.query(
    `INSERT INTO user_unit_scope (user_id, unit_id) VALUES ($1, $2)
     ON CONFLICT (user_id, unit_id) DO NOTHING`,
    [bendaharaId, unitId]
  );

  await pool.query(
    `DELETE FROM program_unit_evaluasi
     WHERE tenant_id = $1 AND program_id IN (
       SELECT id FROM program_unit WHERE tenant_id = $1 AND nama_program LIKE $2
     )`,
    [testTenantId, `${MARKER}-%`]
  );
  await pool.query(
    `DELETE FROM program_unit WHERE tenant_id = $1 AND nama_program LIKE $2`,
    [testTenantId, `${MARKER}-%`]
  );

  const prog = await pool.query(
    `INSERT INTO program_unit (
       unit_id, tenant_id, nama_program, target_program, target_angka,
       realisasi_angka, status
     ) VALUES ($1, $2, $3, 'Target smoke', 100, 10, 'berjalan')
     RETURNING id`,
    [unitId, testTenantId, `${MARKER}-PROGRAM`]
  );
  const programId = prog.rows[0].id;

  const ev = await pool.query(
    `INSERT INTO program_unit_evaluasi (
       program_id, tenant_id, bulan, tahun, progress, efektivitas, created_by
     ) VALUES ($1, $2, 6, 2026, 50, 'efektif', $3)
     RETURNING id`,
    [programId, testTenantId, adminId]
  );

  return {
    testTenantId,
    unitId,
    programId,
    evaluasiId: ev.rows[0].id,
    adminId,
    pimpinanId,
    bendaharaId,
  };
}

async function run() {
  console.log(`Smoke Step 2B.2 — ${BASE}\n`);
  const fx = await ensureFixtures();

  const defaultAuth = await login("admin", "admin123");
  const testAuth = await login("admin_test_2b2", "test1234", TEST_SLUG);
  const pimpinanAuth = await login("pimpinan_test_2b2", "test1234", TEST_SLUG);
  const bendaharaAuth = await login("bendahara_2b2_test", "test1234", TEST_SLUG);

  const defaultH = { Authorization: `Bearer ${defaultAuth.token}` };
  const testH = { Authorization: `Bearer ${testAuth.token}` };
  const pimpinanH = { Authorization: `Bearer ${pimpinanAuth.token}` };
  const bendaharaH = { Authorization: `Bearer ${bendaharaAuth.token}` };

  // 1. Default tidak lihat program tenant test
  const { body: defaultList } = await fetchJson("/program-unit", { headers: defaultH });
  const defaultHasTest = (defaultList.data?.items || []).some(
    (p) => p.nama_program === `${MARKER}-PROGRAM`
  );
  if (!defaultHasTest) ok("default tidak lihat program tenant test");
  else fail("default tidak lihat program tenant test", defaultList.data?.items);

  // 2. Test tenant lihat program sendiri
  const { body: testList } = await fetchJson("/program-unit", { headers: testH });
  const testHasOwn = (testList.data?.items || []).some(
    (p) => p.id === fx.programId
  );
  if (testHasOwn) ok("test tenant lihat program sendiri");
  else fail("test tenant lihat program sendiri", testList.data?.items);

  // 3. Default tidak lihat evaluasi tenant test (by id)
  const { res: defaultEvRes } = await fetchJson(
    `/program-unit/${fx.programId}/evaluasi`,
    { headers: defaultH }
  );
  if (defaultEvRes.status === 404) ok("default tidak lihat evaluasi tenant test (404 program)");
  else fail("default tidak lihat evaluasi tenant test", defaultEvRes.status);

  // 4. Test tenant lihat evaluasi sendiri
  const { body: testEv, res: testEvRes } = await fetchJson(
    `/program-unit/${fx.programId}/evaluasi`,
    { headers: testH }
  );
  if (testEvRes.status === 200 && (testEv.data || []).some((e) => e.id === fx.evaluasiId)) {
    ok("test tenant lihat evaluasi sendiri");
  } else {
    fail("test tenant lihat evaluasi sendiri", testEv);
  }

  // 5. Pimpinan tenant A lihat semua program tenant A (includes marker)
  const { body: pimpinanList } = await fetchJson("/program-unit", { headers: pimpinanH });
  if ((pimpinanList.data?.items || []).some((p) => p.id === fx.programId)) {
    ok("pimpinan tenant A lihat program tenant A");
  } else {
    fail("pimpinan tenant A lihat program tenant A", pimpinanList.data?.items);
  }

  // 6. Bendahara hanya lihat program unit scoped (1 unit PAUD)
  const { body: bendList } = await fetchJson("/program-unit", { headers: bendaharaH });
  const bendItems = bendList.data?.items || [];
  const allPaud = bendItems.every((p) => p.unit_kode === "PAUD");
  const hasMarker = bendItems.some((p) => p.id === fx.programId);
  if (allPaud && hasMarker) ok("bendahara lihat program unit tenant sendiri");
  else fail("bendahara lihat program unit tenant sendiri", bendItems);

  // 7. Cross-tenant GET detail program → 404
  const { res: crossGet } = await fetchJson(`/program-unit/${fx.programId}`, {
    headers: defaultH,
  });
  if (crossGet.status === 404) ok("cross-tenant GET program → 404");
  else fail("cross-tenant GET program", crossGet.status);

  // 8. Cross-tenant PUT program → 404
  const { res: crossPut } = await fetchJson(`/program-unit/${fx.programId}`, {
    method: "PUT",
    headers: { ...defaultH, "Content-Type": "application/json" },
    body: JSON.stringify({
      nama_program: "Hacked",
      target_angka: 1,
      realisasi_angka: 0,
      status: "berjalan",
    }),
  });
  if (crossPut.status === 404) ok("cross-tenant PUT program → 404");
  else fail("cross-tenant PUT program", crossPut.status);

  // 9. Cross-tenant DELETE program → 404
  const { res: crossDel } = await fetchJson(`/program-unit/${fx.programId}`, {
    method: "DELETE",
    headers: defaultH,
  });
  if (crossDel.status === 404) ok("cross-tenant DELETE program → 404");
  else fail("cross-tenant DELETE program", crossDel.status);

  // 10. Cross-tenant PUT evaluasi → 404
  const { res: crossEvPut } = await fetchJson(
    `/program-unit/evaluasi/${fx.evaluasiId}`,
    {
      method: "PUT",
      headers: { ...defaultH, "Content-Type": "application/json" },
      body: JSON.stringify({
        bulan: 6,
        tahun: 2026,
        progress: 99,
        efektivitas: "efektif",
      }),
    }
  );
  if (crossEvPut.status === 404) ok("cross-tenant PUT evaluasi → 404");
  else fail("cross-tenant PUT evaluasi", crossEvPut.status);

  // 11. Cross-tenant DELETE evaluasi → 404
  const { res: crossEvDel } = await fetchJson(
    `/program-unit/evaluasi/${fx.evaluasiId}`,
    { method: "DELETE", headers: defaultH }
  );
  if (crossEvDel.status === 404) ok("cross-tenant DELETE evaluasi → 404");
  else fail("cross-tenant DELETE evaluasi", crossEvDel.status);

  // 12. Cross-tenant POST evaluasi → 404
  const { res: crossEvPost } = await fetchJson(
    `/program-unit/${fx.programId}/evaluasi`,
    {
      method: "POST",
      headers: { ...defaultH, "Content-Type": "application/json" },
      body: JSON.stringify({
        bulan: 7,
        tahun: 2026,
        progress: 10,
        efektivitas: "efektif",
      }),
    }
  );
  if (crossEvPost.status === 404) ok("cross-tenant POST evaluasi → 404");
  else fail("cross-tenant POST evaluasi", crossEvPost.status);

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("ERR", err);
  await pool.end();
  process.exit(1);
});
