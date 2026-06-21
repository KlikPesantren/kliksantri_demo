/**
 * Run migration 028 — Multi-Tenant Step 2A core master data
 * Usage: node scripts/run-migration-028.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/028_core_master_data_tenant.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 028 OK");

  const tables = ["kelas", "guru", "santri", "wali_santri", "wali_akun"];
  for (const table of tables) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(tenant_id)::int AS with_tenant
       FROM ${table}`
    );
    console.log(`${table}:`, rows[0]);
    if (rows[0].total !== rows[0].with_tenant) {
      console.error(`VALIDATION FAIL: ${table} has rows without tenant_id`);
      process.exit(1);
    }
  }

  const { rows: indexes } = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'santri_tenant_nis_key',
        'santri_tenant_uid_rfid_key'
      )
  `);
  console.log("Partial unique indexes:", indexes.map((r) => r.indexname));

  const { rows: constraints } = await pool.query(`
    SELECT conname FROM pg_constraint
    WHERE conname = 'wali_akun_tenant_nomor_hp_key'
  `);
  console.log("wali_akun composite unique:", constraints.length === 1 ? "OK" : "MISSING");

  if (indexes.length < 2 || constraints.length !== 1) {
    process.exit(1);
  }

  console.log("Validation: Step 2A schema OK");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
