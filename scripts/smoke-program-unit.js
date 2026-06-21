/**
 * Smoke test — Program Unit (Phase 5)
 * Usage: node scripts/smoke-program-unit.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_API_BASE || "http://localhost:3000";

const UNIT_USERS = [
  { username: "program_paud", kode: "PAUD" },
  { username: "program_tk", kode: "TK" },
  { username: "program_sd", kode: "SD" },
  { username: "program_mi", kode: "MI" },
  { username: "program_smp", kode: "SMP" },
  { username: "program_sma", kode: "SMA" },
  { username: "program_madinah", kode: "MADINAH" },
];

async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

async function api(token, method, path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function ensureTestUsers() {
  const hash = await bcrypt.hash("test1234", 10);

  await pool.query(
    `INSERT INTO users (nama, username, password, role, status)
     VALUES ('Pimpinan Test', 'pimpinan_test', $1, 'pimpinan_yayasan', 'Aktif')
     ON CONFLICT (username) DO UPDATE SET role = 'pimpinan_yayasan', password = EXCLUDED.password`,
    [hash]
  );

  for (const u of UNIT_USERS) {
    await pool.query(
      `INSERT INTO users (nama, username, password, role, status)
       VALUES ($1, $2, $3, 'bendahara_unit', 'Aktif')
       ON CONFLICT (username) DO UPDATE SET role = 'bendahara_unit', password = EXCLUDED.password`,
      [`Program ${u.kode}`, u.username, hash]
    );

    const unitRow = await pool.query(
      "SELECT id FROM unit_pendidikan WHERE kode = $1",
      [u.kode]
    );
    const userRow = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [u.username]
    );

    if (unitRow.rows[0] && userRow.rows[0]) {
      await pool.query(
        `INSERT INTO user_unit_scope (user_id, unit_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, unit_id) DO NOTHING`,
        [userRow.rows[0].id, unitRow.rows[0].id]
      );
    }
  }
}

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);
  return ok;
}

async function main() {
  await ensureTestUsers();

  let passed = 0;
  let total = 0;
  const assert = (name, ok, detail) => {
    total += 1;
    if (check(name, ok, detail)) passed += 1;
  };

  const admin = await login("admin", "admin123");
  const pimpinan = await login("pimpinan_test", "test1234");

  console.log("=== superadmin ===");
  const adminUnits = await api(admin.token, "GET", "/program-unit/units");
  const adminUnitKodes = (adminUnits.body?.data || []).map((u) => u.kode);
  assert("units HTTP 200", adminUnits.status === 200);
  assert("units >= 7", adminUnitKodes.length >= 7, adminUnitKodes.join(", "));

  const createRes = await api(admin.token, "POST", "/program-unit", {
    unit_kode: "PAUD",
    nama_program: "Smoke Program PAUD",
    target_program: "Santri aktif",
    target_angka: 100,
    realisasi_angka: 25,
    penanggung_jawab: "Admin Test",
    status: "berjalan",
    tanggal_mulai: "2026-01-01",
  });
  assert("POST program", createRes.status === 201, `HTTP ${createRes.status}`);
  const programId = createRes.body?.data?.id;

  const listRes = await api(admin.token, "GET", "/program-unit?page=1&limit=10");
  assert("GET list", listRes.status === 200);
  assert(
    "list has summary",
    listRes.body?.data?.summary?.jumlah_program >= 1,
    String(listRes.body?.data?.summary?.jumlah_program)
  );

  const getRes = await api(admin.token, "GET", `/program-unit/${programId}`);
  assert("GET by id", getRes.status === 200);

  const putRes = await api(admin.token, "PUT", `/program-unit/${programId}`, {
    unit_kode: "PAUD",
    nama_program: "Smoke Program PAUD Updated",
    target_angka: 100,
    realisasi_angka: 50,
    status: "berjalan",
  });
  assert("PUT program", putRes.status === 200);

  const evalRes = await api(admin.token, "POST", `/program-unit/${programId}/evaluasi`, {
    bulan: 6,
    tahun: 2026,
    progress: 50,
    kendala: "Cuaca",
    solusi: "Indoor",
    catatan: "Smoke test",
    efektivitas: "efektif",
  });
  assert("POST evaluasi", evalRes.status === 201, `HTTP ${evalRes.status}`);
  const evalId = evalRes.body?.data?.id;

  const evalList = await api(admin.token, "GET", `/program-unit/${programId}/evaluasi`);
  assert("GET evaluasi list", evalList.status === 200 && evalList.body?.data?.length >= 1);

  const evalPut = await api(admin.token, "PUT", `/program-unit/evaluasi/${evalId}`, {
    bulan: 6,
    tahun: 2026,
    progress: 60,
    efektivitas: "sangat_efektif",
  });
  assert("PUT evaluasi", evalPut.status === 200);

  console.log("\n=== pimpinan_yayasan (view only) ===");
  const pimpList = await api(pimpinan.token, "GET", "/program-unit");
  assert("pimpinan GET list", pimpList.status === 200);
  assert(
    "pimpinan sees programs",
    (pimpList.body?.data?.items || []).length >= 1
  );

  const pimpPost = await api(pimpinan.token, "POST", "/program-unit", {
    unit_kode: "PAUD",
    nama_program: "Should Fail",
    status: "draft",
  });
  assert("pimpinan POST denied", pimpPost.status === 403, `HTTP ${pimpPost.status}`);

  console.log("\n=== unit scope per role ===");
  for (const u of UNIT_USERS) {
    const session = await login(u.username, "test1234");
    assert(`${u.kode} login`, Boolean(session.token), u.username);

    const unitsRes = await api(session.token, "GET", "/program-unit/units");
    const scoped = unitsRes.body?.data || [];
    assert(
      `${u.kode} scoped to 1 unit`,
      unitsRes.status === 200 && scoped.length === 1 && scoped[0].kode === u.kode,
      scoped.map((x) => x.kode).join(", ")
    );

    const ownCreate = await api(session.token, "POST", "/program-unit", {
      unit_kode: u.kode,
      nama_program: `Program ${u.kode} Smoke`,
      target_angka: 10,
      realisasi_angka: 5,
      status: "berjalan",
    });
    assert(`${u.kode} create own`, ownCreate.status === 201, `HTTP ${ownCreate.status}`);

    const otherKode = u.kode === "PAUD" ? "TK" : "PAUD";
    const crossCreate = await api(session.token, "POST", "/program-unit", {
      unit_kode: otherKode,
      nama_program: "Cross unit fail",
      status: "draft",
    });
    assert(
      `${u.kode} cross-unit denied`,
      crossCreate.status === 403,
      `HTTP ${crossCreate.status}`
    );
  }

  console.log("\n=== validation ===");
  const badStatus = await api(admin.token, "POST", "/program-unit", {
    unit_kode: "PAUD",
    nama_program: "Bad status",
    status: "invalid_status",
  });
  assert("invalid status 400", badStatus.status === 400);

  const badEfek = await api(admin.token, "POST", `/program-unit/${programId}/evaluasi`, {
    bulan: 7,
    tahun: 2026,
    progress: 10,
    efektivitas: "invalid",
  });
  assert("invalid efektivitas 400", badEfek.status === 400);

  const noAuth = await api(null, "GET", "/program-unit/units");
  assert("no token 401", noAuth.status === 401);

  console.log("\n=== cleanup soft delete ===");
  const evalDel = await api(admin.token, "DELETE", `/program-unit/evaluasi/${evalId}`);
  assert("DELETE evaluasi", evalDel.status === 200);

  const delRes = await api(admin.token, "DELETE", `/program-unit/${programId}`);
  assert("DELETE soft", delRes.status === 200);

  const afterDel = await api(admin.token, "GET", `/program-unit/${programId}`);
  assert("deleted hidden from GET", afterDel.status === 404);

  console.log(`\nResult: ${passed}/${total} passed`);
  await pool.end();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
