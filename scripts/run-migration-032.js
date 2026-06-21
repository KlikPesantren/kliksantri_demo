/**
 * Run migration 032 — pengumuman tenant scope
 * Usage: node scripts/run-migration-032.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/032_pengumuman_tenant.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 032 OK");

  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(tenant_id)::int AS with_tenant FROM pengumuman`
  );
  console.log("pengumuman:", rows[0]);
  if (rows[0].total !== rows[0].with_tenant) {
    process.exit(1);
  }

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
