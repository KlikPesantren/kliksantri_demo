/**
 * Smoke test — Kas Instansi 7-unit expansion (migration 024)
 * Usage: node scripts/smoke-kas-instansi-unit-expansion.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_API_BASE || "http://localhost:3000";
const EXPECTED_UNITS = ["PAUD", "TK", "SD", "MI", "SMP", "SMA", "MADINAH"];

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

  await pool.query(
    `INSERT INTO users (nama, username, password, role, status)
     VALUES ('Bendahara PAUD Test', 'bendahara_paud_test', $1, 'bendahara_unit', 'Aktif')
     ON CONFLICT (username) DO UPDATE SET role = 'bendahara_unit', password = EXCLUDED.password`,
    [hash]
  );

  const paud = await pool.query("SELECT id FROM unit_pendidikan WHERE kode = 'PAUD'");
  const bendahara = await pool.query(
    "SELECT id FROM users WHERE username = 'bendahara_paud_test'"
  );

  await pool.query(
    `INSERT INTO user_unit_scope (user_id, unit_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, unit_id) DO NOTHING`,
    [bendahara.rows[0].id, paud.rows[0].id]
  );
}

function assertCase(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);
  return ok;
}

async function main() {
  await ensureTestUsers();

  const admin = await login("admin", "admin123");
  const pimpinan = await login("pimpinan_test", "test1234");
  const bendahara = await login("bendahara_paud_test", "test1234");

  let passed = 0;
  let total = 0;
  const check = (name, ok, detail) => {
    total += 1;
    if (assertCase(name, ok, detail)) passed += 1;
  };

  const bulan = new Date().getMonth() + 1;
  const tahun = new Date().getFullYear();

  console.log("=== superadmin: GET /units ===");
  const superUnits = await api(admin.token, "GET", "/kas-instansi/units");
  const superList = superUnits.body?.data || [];
  const superKodes = superList.map((u) => u.kode);
  check(
    "superadmin units HTTP 200",
    superUnits.status === 200,
    `HTTP ${superUnits.status}`
  );
  check(
    "superadmin 7 units",
    superKodes.length === 7 && EXPECTED_UNITS.every((k) => superKodes.includes(k)),
    superKodes.join(", ")
  );
  check(
    "superadmin sort_order",
    JSON.stringify(superKodes) === JSON.stringify(EXPECTED_UNITS),
    superKodes.join(" > ")
  );

  console.log("\n=== pimpinan_yayasan: GET /units ===");
  const pimpUnits = await api(pimpinan.token, "GET", "/kas-instansi/units");
  const pimpKodes = (pimpUnits.body?.data || []).map((u) => u.kode);
  check("pimpinan units HTTP 200", pimpUnits.status === 200);
  check(
    "pimpinan 7 units sorted",
    JSON.stringify(pimpKodes) === JSON.stringify(EXPECTED_UNITS),
    pimpKodes.join(", ")
  );

  console.log("\n=== bendahara_unit: scoped units ===");
  const bendUnits = await api(bendahara.token, "GET", "/kas-instansi/units");
  const bendList = bendUnits.body?.data || [];
  check("bendahara units HTTP 200", bendUnits.status === 200);
  check(
    "bendahara only PAUD scope",
    bendList.length === 1 && bendList[0].kode === "PAUD",
    bendList.map((u) => u.kode).join(", ")
  );

  console.log("\n=== ringkasan + transaksi per unit (superadmin sample) ===");
  for (const kode of ["PAUD", "TK", "MADINAH"]) {
    const ring = await api(
      admin.token,
      "GET",
      `/kas-instansi/${kode}/ringkasan?bulan=${bulan}&tahun=${tahun}`
    );
    const trx = await api(
      admin.token,
      "GET",
      `/kas-instansi/${kode}/transaksi?bulan=${bulan}&tahun=${tahun}&page=1&limit=10`
    );
    check(`${kode} ringkasan`, ring.status === 200, `HTTP ${ring.status}`);
    check(`${kode} transaksi`, trx.status === 200, `HTTP ${trx.status}`);
  }

  console.log("\n=== konsolidasi ===");
  const kons = await api(
    admin.token,
    "GET",
    `/kas-instansi/konsolidasi?bulan=${bulan}&tahun=${tahun}`
  );
  const konsUnitKodes = (kons.body?.data?.units || []).map((u) => u.kode);
  check("konsolidasi HTTP 200", kons.status === 200);
  check(
    "konsolidasi includes 7 units",
    konsUnitKodes.length === 7 && EXPECTED_UNITS.every((k) => konsUnitKodes.includes(k)),
    konsUnitKodes.join(", ")
  );

  console.log("\n=== MADIN legacy kode must not exist ===");
  const madinLegacy = await api(
    admin.token,
    "GET",
    `/kas-instansi/MADIN/ringkasan?bulan=${bulan}&tahun=${tahun}`
  );
  check("MADIN kode returns 404", madinLegacy.status === 404, `HTTP ${madinLegacy.status}`);

  console.log("\n=== orphan FK check ===");
  const orphans = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM kas_instansi_transaksi t
       LEFT JOIN unit_pendidikan u ON u.id = t.unit_id WHERE u.id IS NULL) AS tx_orphans,
      (SELECT COUNT(*) FROM user_unit_scope s
       LEFT JOIN unit_pendidikan u ON u.id = s.unit_id WHERE u.id IS NULL) AS scope_orphans
  `);
  const { tx_orphans, scope_orphans } = orphans.rows[0];
  check("no orphan transaksi", Number(tx_orphans) === 0, String(tx_orphans));
  check("no orphan user_unit_scope", Number(scope_orphans) === 0, String(scope_orphans));

  console.log(`\nResult: ${passed}/${total} passed`);
  await pool.end();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
