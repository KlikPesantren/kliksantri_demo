/**
 * Run migration 029 — Multi-Tenant Step 2B keuangan & dashboard
 * Usage: node scripts/run-migration-029.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const TABLES = [
  "jenis_tagihan",
  "buku_kas",
  "pembayaran",
  "pembayaran_detail",
  "tagihan_sahriyah",
  "pembayaran_sahriyah",
  "sahriyah_setting",
];

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/029_keuangan_dashboard_tenant.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 029 OK");

  for (const table of TABLES) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total, COUNT(tenant_id)::int AS with_tenant FROM ${table}`
    );
    console.log(`${table}:`, rows[0]);
    if (rows[0].total !== rows[0].with_tenant) {
      console.error(`VALIDATION FAIL: ${table}`);
      process.exit(1);
    }
  }

  const { rows: idx } = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'tagihan_sahriyah_tenant_santri_bulan_tahun_key'
  `);
  const { rows: con } = await pool.query(`
    SELECT conname FROM pg_constraint
    WHERE conname = 'sahriyah_setting_tenant_santri_key'
  `);

  if (idx.length !== 1 || con.length !== 1) {
    console.error("VALIDATION FAIL: unique constraints");
    process.exit(1);
  }

  console.log("Validation: Step 2B schema OK");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
