/**
 * Run migration 040 — tahun_berdiri on profil_pesantren
 * Usage: node scripts/run-migration-040.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/040_add_tahun_berdiri_profil_pesantren.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 040 OK");

  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'profil_pesantren'
       AND column_name = 'tahun_berdiri'`
  );
  console.log("column tahun_berdiri:", rows.length ? "OK" : "MISSING");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
