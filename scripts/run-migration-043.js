/**
 * Run migration 043 — audit_logs tenant_id (nullable)
 * Usage: node scripts/run-migration-043.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/043_audit_logs_tenant.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 043 OK");

  const { rows: cols } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'audit_logs'
       AND column_name = 'tenant_id'`,
  );
  if (!cols.length) {
    console.error("FAIL: audit_logs.tenant_id missing");
    process.exit(1);
  }

  const { rows: stats } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(tenant_id)::int AS with_tenant
     FROM audit_logs`,
  );
  console.log("audit_logs:", stats[0]);

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
