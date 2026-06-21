/**
 * Run migration 025 — Program Unit
 * Usage: node scripts/run-migration-025.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/025_program_unit.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 025 OK");

  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('program_unit', 'program_unit_evaluasi')
     ORDER BY 1`
  );
  console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

  const perms = await pool.query(
    "SELECT key FROM permissions WHERE grup = 'program_unit' ORDER BY key"
  );
  console.log("Perms:", perms.rows.map((r) => r.key).join(", "));

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
