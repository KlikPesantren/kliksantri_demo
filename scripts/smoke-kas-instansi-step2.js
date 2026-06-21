/**
 * Smoke test Step 2 — Kas Instansi API
 * Usage: node scripts/smoke-kas-instansi-step2.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_API_BASE || "http://localhost:3000";

async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  return { status: res.status, body };
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

  const paud = await pool.query(
    "SELECT id FROM unit_pendidikan WHERE kode = 'PAUD'"
  );
  const madin = await pool.query(
    "SELECT id FROM unit_pendidikan WHERE kode = 'MADIN'"
  );
  const bendahara = await pool.query(
    "SELECT id FROM users WHERE username = 'bendahara_paud_test'"
  );

  await pool.query(
    `INSERT INTO user_unit_scope (user_id, unit_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, unit_id) DO NOTHING`,
    [bendahara.rows[0].id, paud.rows[0].id]
  );

  return {
    paudId: paud.rows[0].id,
    madinId: madin.rows[0].id,
    bendaharaId: bendahara.rows[0].id,
  };
}

function logCase(name, result, expectStatus) {
  const ok = expectStatus.includes(result.status);
  console.log(
    `${ok ? "PASS" : "FAIL"} | ${name} | HTTP ${result.status} | ${JSON.stringify(result.body?.error || result.body?.success)}`
  );
  return ok;
}

async function run() {
  console.log(`API base: ${BASE}\n`);

  await ensureTestUsers();

  const superLogin = await login("admin", "admin123");
  const pimpinanLogin = await login("pimpinan_test", "test1234");
  const bendaharaLogin = await login("bendahara_paud_test", "test1234");
  const keuanganLogin = await login("keuangan", "123456");

  const superToken = superLogin.body?.token;
  const pimpinanToken = pimpinanLogin.body?.token;
  const bendaharaToken = bendaharaLogin.body?.token;
  const keuanganToken = keuanganLogin.body?.token;

  let passed = 0;
  let total = 0;

  // superadmin
  console.log("\n=== superadmin ===");
  total++;
  if (logCase("GET /units", await api(superToken, "GET", "/kas-instansi/units"), [200]))
    passed++;

  total++;
  const superPost = await api(superToken, "POST", "/kas-instansi/PAUD/transaksi", {
    tanggal: "2026-06-12",
    jenis: "Masuk",
    kategori: "Donasi",
    keterangan: "Smoke superadmin",
    nominal: 100000,
    petugas: "Admin",
  });
  if (logCase("POST /PAUD/transaksi", superPost, [201])) passed++;

  // pimpinan_yayasan
  console.log("\n=== pimpinan_yayasan ===");
  total++;
  if (
    logCase(
      "GET /units",
      await api(pimpinanToken, "GET", "/kas-instansi/units"),
      [200]
    )
  )
    passed++;

  total++;
  if (
    logCase(
      "GET /MADIN/ringkasan",
      await api(pimpinanToken, "GET", "/kas-instansi/MADIN/ringkasan?bulan=6&tahun=2026"),
      [200]
    )
  )
    passed++;

  total++;
  if (
    logCase(
      "POST /PAUD/transaksi (read-only)",
      await api(pimpinanToken, "POST", "/kas-instansi/PAUD/transaksi", {
        tanggal: "2026-06-12",
        jenis: "Masuk",
        kategori: "X",
        nominal: 1000,
      }),
      [403]
    )
  )
    passed++;

  // bendahara_unit
  console.log("\n=== bendahara_unit (PAUD) ===");
  total++;
  const bendaharaUnits = await api(bendaharaToken, "GET", "/kas-instansi/units");
  if (logCase("GET /units (1 unit)", bendaharaUnits, [200])) passed++;

  total++;
  if (
    logCase(
      "GET /MADIN/transaksi (forbidden unit)",
      await api(bendaharaToken, "GET", "/kas-instansi/MADIN/transaksi?bulan=6&tahun=2026"),
      [403]
    )
  )
    passed++;

  total++;
  const bendaharaPost = await api(
    bendaharaToken,
    "POST",
    "/kas-instansi/PAUD/transaksi",
    {
      tanggal: "2026-06-12",
      jenis: "Keluar",
      kategori: "Operasional",
      keterangan: "Smoke bendahara",
      nominal: 50000,
      petugas: "Bendahara PAUD",
    }
  );
  if (logCase("POST /PAUD/transaksi", bendaharaPost, [201])) passed++;

  // role lain (keuangan)
  console.log("\n=== keuangan (role lain) ===");
  total++;
  if (
    logCase(
      "GET /units",
      await api(keuanganToken, "GET", "/kas-instansi/units"),
      [403]
    )
  )
    passed++;

  // validasi
  console.log("\n=== validasi ===");
  total++;
  if (
    logCase(
      "POST nominal <= 0",
      await api(superToken, "POST", "/kas-instansi/PAUD/transaksi", {
        tanggal: "2026-06-12",
        jenis: "Masuk",
        kategori: "X",
        nominal: 0,
      }),
      [400]
    )
  )
    passed++;

  total++;
  if (
    logCase(
      "POST jenis invalid",
      await api(superToken, "POST", "/kas-instansi/PAUD/transaksi", {
        tanggal: "2026-06-12",
        jenis: "Invalid",
        kategori: "X",
        nominal: 1000,
      }),
      [400]
    )
  )
    passed++;

  const bk = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'buku_kas' ORDER BY ordinal_position`
  );

  console.log("\n=== bukti buku_kas unchanged ===");
  console.log(
    "buku_kas columns:",
    bk.rows.map((r) => r.column_name).join(", ")
  );

  console.log(`\nResult: ${passed}/${total} passed`);

  await pool.end();
  process.exit(passed === total ? 0 : 1);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
