require("dotenv").config();
const pool = require("../db");

async function run() {
  const tables = await pool.query(`
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);

  const rows = [];
  for (const { table_name } of tables.rows) {
    const cols = await pool.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1`,
      [table_name]
    );
    let rowCount = 0;
    try {
      const c = await pool.query(`SELECT COUNT(*)::int AS n FROM "${table_name}"`);
      rowCount = c.rows[0].n;
    } catch {
      rowCount = -1;
    }
    const colList = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [table_name]
    );
    rows.push({
      table: table_name,
      columns: cols.rows[0].n,
      rows: rowCount,
      column_names: colList.rows.map((c) => c.column_name),
    });
  }
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
