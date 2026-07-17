require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "migrations", "063_rbac_module_permissions.sql"), "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(
    `SELECT key, grup FROM permissions
     WHERE key IN ('alumni.view', 'alumni.manage', 'konten_pesantren.view', 'konten_pesantren.manage', 'wallet.view', 'wallet.manage')
     ORDER BY grup, key`,
  );
  console.table(rows);
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
