require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/023_kas_instansi_yayasan.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 023 OK");

  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('unit_pendidikan', 'kas_instansi_transaksi', 'user_unit_scope')
     ORDER BY 1`
  );
  console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

  const units = await pool.query(
    "SELECT kode, nama FROM unit_pendidikan ORDER BY sort_order"
  );
  console.log("Units:", JSON.stringify(units.rows));

  const perms = await pool.query(
    "SELECT key FROM permissions WHERE grup = 'kas_instansi' ORDER BY key"
  );
  console.log("Perms:", perms.rows.map((r) => r.key).join(", "));

  const roles = await pool.query(
    "SELECT name FROM roles WHERE name IN ('pimpinan_yayasan', 'bendahara_unit')"
  );
  console.log("Roles:", roles.rows.map((r) => r.name).join(", "));

  const bk = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'buku_kas' ORDER BY ordinal_position`
  );
  console.log("buku_kas cols:", bk.rows.map((c) => c.column_name).join(", "));

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
