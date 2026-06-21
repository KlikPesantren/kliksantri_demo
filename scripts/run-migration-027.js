/**
 * Run migration 027 — Multi-Tenant Step 1: Tenant Foundation
 * Usage: node scripts/run-migration-027.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/027_tenants_foundation.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 027 OK");

  const { rows: tenants } = await pool.query(
    `SELECT id, slug, nama, status FROM tenants ORDER BY id`
  );
  console.log("Tenants:", tenants);

  const { rows: users } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(tenant_id)::int AS with_tenant
     FROM users`
  );
  console.log("Users:", users[0]);

  const { rows: profil } = await pool.query(
    `SELECT id, nama_pesantren, tenant_id FROM profil_pesantren ORDER BY id`
  );
  console.log("Profil pesantren:", profil);

  if (tenants.length === 0) {
    console.error("VALIDATION FAIL: no tenants");
    process.exit(1);
  }

  if (users[0].total !== users[0].with_tenant) {
    console.error("VALIDATION FAIL: users without tenant_id");
    process.exit(1);
  }

  console.log("Validation: tenant foundation OK");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
