/**
 * Run migration 036 — tenant onboarding schema
 * Usage: node scripts/run-migration-036.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/036_tenant_onboarding.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 036 OK");

  const { rows: def } = await pool.query(
    `SELECT id, slug, status, onboarded_at FROM tenants WHERE slug = 'default'`
  );
  console.log("default tenant:", def[0]);
  if (!def.length || def[0].status !== "active") {
    console.error("FAIL: default tenant must remain active");
    process.exit(1);
  }

  const { rows: cols } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'tenants'
       AND column_name IN ('suspended_at', 'suspended_reason', 'onboarded_at', 'created_by')`
  );
  console.log("tenants columns:", cols.map((c) => c.column_name));

  const { rows: idx } = await pool.query(
    `SELECT indexname FROM pg_indexes
     WHERE tablename = 'profil_pesantren'
       AND indexname = 'profil_pesantren_tenant_id_key'`
  );
  console.log("profil_pesantren unique tenant_id:", idx.length > 0 ? "OK" : "MISSING");

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
