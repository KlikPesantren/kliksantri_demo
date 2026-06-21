/**
 * Run migration 026 — pimpinan_yayasan read-only
 * Usage: node scripts/run-migration-026.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const WHITELIST = [
  "dashboard.view",
  "santri.view", "wali.view", "guru.view", "kelas.view",
  "absensi.view", "hafalan.view", "nilai.view",
  "pelanggaran.view", "perizinan.view",
  "pembayaran.view", "bukukas.view",
  "kas_instansi.view", "kas_instansi.konsolidasi",
  "program_unit.view",
];

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/026_pimpinan_yayasan_readonly.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 026 OK");

  const { rows } = await pool.query(`
    SELECT p.key
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = 'pimpinan_yayasan'
    ORDER BY p.key
  `);
  const keys = rows.map((r) => r.key);
  console.log("Permissions (" + keys.length + "):", keys.join(", "));

  const missing = WHITELIST.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !WHITELIST.includes(k));
  if (missing.length || extra.length) {
    console.error("VALIDATION FAIL", { missing, extra });
    process.exit(1);
  }
  console.log("Validation: whitelist OK (" + WHITELIST.length + " permissions)");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
