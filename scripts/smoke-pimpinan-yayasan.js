/**
 * Smoke test — Phase 6 pimpinan_yayasan read-only
 * Usage: node scripts/smoke-pimpinan-yayasan.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");
const requirePermission = require("../middleware/requirePermission");

const BASE = process.env.SMOKE_API_BASE || "http://localhost:3000";

const WHITELIST = [
  "dashboard.view",
  "santri.view", "wali.view", "guru.view", "kelas.view",
  "absensi.view", "hafalan.view", "nilai.view",
  "pelanggaran.view", "perizinan.view",
  "pembayaran.view", "bukukas.view",
  "kas_instansi.view", "kas_instansi.konsolidasi",
  "program_unit.view",
];

const GET_MODULES = [
  { name: "dashboard", path: "/dashboard/summary" },
  { name: "santri", path: "/santri" },
  { name: "wali", path: "/wali" },
  { name: "guru", path: "/guru" },
  { name: "kelas", path: "/kelas" },
  { name: "absensi", path: "/absensi" },
  { name: "hafalan", path: "/hafalan" },
  { name: "nilai", path: "/nilai" },
  { name: "pelanggaran", path: "/pelanggaran" },
  { name: "perizinan", path: "/perizinan" },
  { name: "pembayaran", path: "/pembayaran" },
  { name: "buku-kas", path: "/buku-kas" },
  { name: "kas-instansi units", path: "/kas-instansi/units" },
  { name: "kas-instansi konsolidasi", path: "/kas-instansi/konsolidasi" },
  { name: "program-unit", path: "/program-unit?page=1&limit=5" },
];

const FORBIDDEN_GET = [
  { name: "users", path: "/users" },
  { name: "roles", path: "/roles" },
  { name: "pengumuman", path: "/pengumuman" },
  { name: "profil-pesantren", path: "/profil-pesantren" },
  { name: "kesehatan", path: "/kesehatan" },
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

async function ensurePimpinan() {
  const hash = await bcrypt.hash("test1234", 10);
  await pool.query(
    `INSERT INTO users (nama, username, password, role, status)
     VALUES ('Pimpinan Test', 'pimpinan_test', $1, 'pimpinan_yayasan', 'Aktif')
     ON CONFLICT (username) DO UPDATE SET role = 'pimpinan_yayasan', password = EXCLUDED.password`,
    [hash]
  );
}

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);
  return ok;
}

async function main() {
  await ensurePimpinan();
  requirePermission.invalidateCache();

  let passed = 0;
  let total = 0;
  const assert = (name, ok, detail) => {
    total += 1;
    if (check(name, ok, detail)) passed += 1;
  };

  console.log("=== DB permission matrix ===");
  const dbPerms = await pool.query(`
    SELECT p.key FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = 'pimpinan_yayasan'
    ORDER BY p.key
  `);
  const keys = dbPerms.rows.map((r) => r.key);
  assert("DB has 15 whitelist perms", keys.length === WHITELIST.length, String(keys.length));
  assert(
    "DB whitelist exact",
    JSON.stringify(keys) === JSON.stringify([...WHITELIST].sort()),
    keys.join(", ")
  );
  const bad = keys.filter(
    (k) =>
      k.includes(".manage") ||
      k.includes(".create") ||
      k.includes(".update") ||
      k.includes(".delete")
  );
  assert("DB no write perms", bad.length === 0, bad.join(", "));

  console.log("\n=== login pimpinan ===");
  const session = await login("pimpinan_test", "test1234");
  assert("login success", Boolean(session.token));

  const mePerms = session.user?.permissions || [];
  assert(
    "login permissions count",
    mePerms.length === WHITELIST.length,
    String(mePerms.length)
  );

  console.log("\n=== GET allowed modules (200) ===");
  for (const mod of GET_MODULES) {
    const res = await api(session.token, "GET", mod.path);
    assert(`GET ${mod.name}`, res.status === 200, `HTTP ${res.status}`);
  }

  console.log("\n=== GET forbidden modules (403) ===");
  for (const mod of FORBIDDEN_GET) {
    const res = await api(session.token, "GET", mod.path);
    assert(`GET ${mod.name} denied`, res.status === 403, `HTTP ${res.status}`);
  }

  console.log("\n=== POST write denied (403) ===");
  const postSantri = await api(session.token, "POST", "/santri", {
    nama: "Should Fail",
    nis: "FAIL-001",
  });
  assert("POST santri", postSantri.status === 403, `HTTP ${postSantri.status}`);

  const postBukuKas = await api(session.token, "POST", "/buku-kas", {
    jenis: "Masuk",
    kategori: "Test",
    nominal: 1000,
  });
  assert("POST buku-kas", postBukuKas.status === 403, `HTTP ${postBukuKas.status}`);

  const postProgram = await api(session.token, "POST", "/program-unit", {
    unit_kode: "PAUD",
    nama_program: "Should Fail",
    status: "draft",
  });
  assert("POST program-unit", postProgram.status === 403, `HTTP ${postProgram.status}`);

  const postKas = await api(session.token, "POST", "/kas-instansi/PAUD/transaksi", {
    tanggal: "2026-06-01",
    jenis: "Masuk",
    kategori: "Test",
    nominal: 1000,
  });
  assert("POST kas-instansi", postKas.status === 403, `HTTP ${postKas.status}`);

  console.log("\n=== GET konsolidasi yayasan (200) ===");
  const kons = await api(
    session.token,
    "GET",
    `/kas-instansi/konsolidasi?bulan=${new Date().getMonth() + 1}&tahun=${new Date().getFullYear()}`
  );
  assert("GET konsolidasi", kons.status === 200, `HTTP ${kons.status}`);

  console.log(`\nResult: ${passed}/${total} passed`);
  await pool.end();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
