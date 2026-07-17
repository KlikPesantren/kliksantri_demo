require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  for (const file of ["061_core_unit_id.sql", "062_unit_scope_core_relations.sql"]) {
    const sql = fs.readFileSync(path.join(__dirname, "..", "migrations", file), "utf8");
    await pool.query(sql);
    console.log(`${file} OK`);
  }

  const { rows } = await pool.query(`
    SELECT t.slug, COUNT(DISTINCT u.id)::int AS units,
           COUNT(DISTINCT k.id)::int AS classes,
           COUNT(DISTINCT g.id)::int AS teachers
    FROM tenants t
    LEFT JOIN unit_pendidikan u ON u.tenant_id = t.id AND u.is_active = true
    LEFT JOIN kelas k ON k.tenant_id = t.id AND k.unit_id = u.id
    LEFT JOIN guru g ON g.tenant_id = t.id AND g.unit_id = u.id
    GROUP BY t.id, t.slug
    ORDER BY t.slug
  `);
  console.table(rows);
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
