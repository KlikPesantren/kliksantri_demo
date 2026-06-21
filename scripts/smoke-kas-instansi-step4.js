/**
 * Smoke test Step 4 — Konsolidasi Yayasan
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
  return res.json();
}

async function api(token, method, path) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const hash = await bcrypt.hash("test1234", 10);
  await pool.query(
    `INSERT INTO users (nama, username, password, role, status)
     VALUES ('Pimpinan Test', 'pimpinan_test', $1, 'pimpinan_yayasan', 'Aktif')
     ON CONFLICT (username) DO UPDATE SET role = 'pimpinan_yayasan'`,
    [hash]
  );

  const admin = await login("admin", "admin123");
  const pimpinan = await login("pimpinan_test", "test1234");
  const bendahara = await login("bendahara_paud_test", "test1234");
  const keuangan = await login("keuangan", "123456");

  let passed = 0;
  let total = 0;

  const assert = (name, result, expectStatus, check) => {
    total += 1;
    const ok =
      expectStatus.includes(result.status) &&
      (check ? check(result.body) : true);
    console.log(
      `${ok ? "PASS" : "FAIL"} | ${name} | HTTP ${result.status} | ${result.body?.error || "OK"}`
    );
    if (ok) passed += 1;
    return result;
  };

  console.log("=== superadmin ===");
  const superRes = assert(
    "GET /konsolidasi",
    await api(admin.token, "GET", "/kas-instansi/konsolidasi?bulan=6&tahun=2026"),
    [200],
    (b) =>
      b.data?.kas_pondok?.source === "buku_kas" &&
      Array.isArray(b.data?.units) &&
      b.data?.units.length === 4 &&
      typeof b.data?.kpi?.total_kas_yayasan === "number"
  );
  if (superRes.body?.data) {
    console.log("  KPI:", JSON.stringify(superRes.body.data.kpi));
    console.log("  Units:", superRes.body.data.units.map((u) => u.kode).join(", "));
  }

  console.log("\n=== pimpinan_yayasan ===");
  assert(
    "GET /konsolidasi",
    await api(pimpinan.token, "GET", "/kas-instansi/konsolidasi?bulan=6&tahun=2026"),
    [200]
  );

  console.log("\n=== bendahara_unit (denied) ===");
  assert(
    "GET /konsolidasi",
    await api(bendahara.token, "GET", "/kas-instansi/konsolidasi"),
    [403]
  );

  console.log("\n=== keuangan (denied) ===");
  assert(
    "GET /konsolidasi",
    await api(keuangan.token, "GET", "/kas-instansi/konsolidasi"),
    [403]
  );

  console.log(`\nResult: ${passed}/${total} passed`);
  await pool.end();
  process.exit(passed === total ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
