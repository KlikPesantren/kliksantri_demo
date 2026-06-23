/**
 * Run migration 045 - tenant billing foundation
 * Usage: node scripts/run-migration-045.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/045_tenant_billing_foundation.sql"
  );

  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 045 OK");

  const { rows } = await pool.query(
    `SELECT slug, plan_code, billing_status, subscription_expires_at
     FROM tenants
     WHERE slug IN ('default', 'al-hikmah')
     ORDER BY slug`
  );

  for (const row of rows) {
    console.log(
      `${row.slug}: ${row.plan_code}/${row.billing_status} expires=${row.subscription_expires_at?.toISOString?.() || row.subscription_expires_at}`
    );
  }

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
