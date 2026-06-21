/**
 * Run migration 031 — Program Unit tenant scope
 * Usage: node scripts/run-migration-031.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const TABLES = ["program_unit", "program_unit_evaluasi"];

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/031_program_unit_tenant.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 031 OK");

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

  const { rows: mismatch } = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM program_unit_evaluasi e
    JOIN program_unit p ON p.id = e.program_id
    WHERE e.tenant_id <> p.tenant_id
  `);
  if (mismatch[0].n !== 0) {
    console.error("VALIDATION FAIL: evaluasi tenant mismatch", mismatch[0].n);
    process.exit(1);
  }

  console.log("Validation: Step 2B.2 schema OK");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
