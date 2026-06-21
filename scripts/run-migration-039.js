/**
 * Run migration 039 — push notification foundation
 * Usage: node scripts/run-migration-039.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/039_push_notifications.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 039 OK");

  const { rows } = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('wali_push_tokens', 'notification_logs')
     ORDER BY table_name`
  );
  console.log("tables:", rows.map((r) => r.table_name).join(", "));
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
