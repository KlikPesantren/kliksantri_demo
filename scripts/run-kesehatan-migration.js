const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  const sqlPath = path.join(__dirname, '../migrations/021_kesehatan_santri.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await pool.query(sql);

  const table = await pool.query(
    "SELECT to_regclass('public.kesehatan_santri') AS tbl"
  );
  const perms = await pool.query(
    "SELECT key FROM permissions WHERE key LIKE 'kesehatan.%' ORDER BY key"
  );

  console.log('table:', table.rows[0].tbl);
  console.log('permissions:', perms.rows.map((r) => r.key));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
