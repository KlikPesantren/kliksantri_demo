/**
 * Run migration 034 — pendidikan & keamanan tenant scope
 * Usage: node scripts/run-migration-034.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const TABLES = [
  "absensi",
  "absensi_santri",
  "absensi_guru",
  "hafalan",
  "nilai_mingguan",
  "pelanggaran",
  "perizinan",
  "kesehatan_santri",
  "tamu",
];

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/034_pendidikan_keamanan_tenant.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 034 OK");

  for (const table of TABLES) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total, COUNT(tenant_id)::int AS with_tenant FROM ${table}`
    );
    console.log(`${table}:`, rows[0]);
    if (rows[0].total !== rows[0].with_tenant) {
      console.error(`FAIL: ${table} has rows without tenant_id`);
      process.exit(1);
    }
  }

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
