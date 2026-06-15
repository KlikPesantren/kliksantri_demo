const pool = require('../db');

async function main() {
  const { rows } = await pool.query(`
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profil_pesantren'
    ORDER BY ordinal_position
  `);

  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
