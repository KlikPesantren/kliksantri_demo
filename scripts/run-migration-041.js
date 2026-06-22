/**
 * Run migration 041 — pembayaran duplicate safety index
 * Usage: node scripts/run-migration-041.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/041_pembayaran_safety_lock.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 041 OK");

  const { rows } = await pool.query(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname = 'pembayaran_tenant_santri_jenis_bulan_tahun_key'`
  );
  console.log("unique index pembayaran:", rows.length ? "OK" : "MISSING");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
