/**
 * Run migration 030 — Kas Instansi tenant scope
 * Usage: node scripts/run-migration-030.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const TABLES = ["unit_pendidikan", "kas_instansi_transaksi"];

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/030_kas_instansi_tenant.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 030 OK");

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

  const { rows: con } = await pool.query(`
    SELECT conname FROM pg_constraint
    WHERE conname = 'unit_pendidikan_tenant_kode_key'
  `);
  if (con.length !== 1) {
    console.error("VALIDATION FAIL: unit_pendidikan_tenant_kode_key");
    process.exit(1);
  }

  const { rows: orphans } = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM user_unit_scope s
    JOIN users usr ON usr.id = s.user_id
    JOIN unit_pendidikan u ON u.id = s.unit_id
    WHERE usr.tenant_id <> u.tenant_id
  `);
  if (orphans[0].n !== 0) {
    console.error("VALIDATION FAIL: cross-tenant user_unit_scope", orphans[0].n);
    process.exit(1);
  }

  console.log("Validation: Step 2B.1 schema OK");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
