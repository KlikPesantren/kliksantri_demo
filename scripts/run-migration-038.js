/**
 * Run migration 038 — santri import columns
 * Usage: node scripts/run-migration-038.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/038_santri_import_columns.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 038 OK");

  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'santri'
       AND column_name IN ('jenis_kelamin', 'tanggal_lahir')`
  );
  console.log("columns:", rows.map((r) => r.column_name).join(", "));
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
