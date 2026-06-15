const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  const sqlPath = path.join(__dirname, '../migrations/020_profil_pesantren_branding_audit_fix.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await pool.query(sql);

  const { rows } = await pool.query(`
    SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profil_pesantren'
    ORDER BY ordinal_position
  `);

  const required = [
    'banner_url',
    'banner_active',
    'splash_logo_url',
    'app_icon_url',
    'tagline',
    'tentang',
  ];

  const present = new Set(rows.map((r) => r.column_name));
  const missing = required.filter((c) => !present.has(c));

  console.log('=== SCHEMA AFTER MIGRATION ===');
  console.log(JSON.stringify(rows, null, 2));
  console.log('\n=== REQUIRED COLUMNS ===');
  required.forEach((col) => {
    console.log(`${present.has(col) ? 'OK' : 'MISSING'}  ${col}`);
  });

  if (missing.length) {
    console.error('\nStill missing:', missing.join(', '));
    process.exit(1);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
