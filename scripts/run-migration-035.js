/**
 * Run migration 035 — platform superadmin foundation
 * Usage: node scripts/run-migration-035.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/035_platform_superadmin.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 035 SQL OK");

  const { rows: roleRows } = await pool.query(
    `SELECT id, name FROM roles WHERE name = 'platform_superadmin'`
  );
  if (!roleRows.length) {
    console.error("FAIL: role platform_superadmin missing");
    process.exit(1);
  }
  console.log("role:", roleRows[0]);

  const { rows: permRows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM permissions WHERE grup = 'platform'`
  );
  console.log("platform permissions:", permRows[0].n);
  if (permRows[0].n < 4) {
    console.error("FAIL: expected 4 platform permissions");
    process.exit(1);
  }

  const existing = await pool.query(
    `SELECT id FROM users WHERE username = $1 AND tenant_id IS NULL`,
    ["platform"]
  );

  if (!existing.rows.length) {
    const hash = await bcrypt.hash("123456", 10);
    await pool.query(
      `INSERT INTO users (nama, username, password, role, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, NULL)`,
      ["Platform Admin", "platform", hash, "platform_superadmin", "Aktif"]
    );
    console.log("platform user created");
  } else {
    await pool.query(
      `UPDATE users
       SET role = 'platform_superadmin', tenant_id = NULL, status = 'Aktif'
       WHERE username = $1 AND tenant_id IS NULL`,
      ["platform"]
    );
    console.log("platform user already exists (role synced)");
  }

  const { rows: idx } = await pool.query(
    `SELECT indexname FROM pg_indexes
     WHERE tablename = 'users'
       AND indexname IN ('users_tenant_username_key', 'users_platform_username_key')`
  );
  console.log("username indexes:", idx.map((r) => r.indexname));

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
