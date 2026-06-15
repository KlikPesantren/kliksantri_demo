const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  const sqlPath = path.join(__dirname, '../migrations/022_fix_superadmin_kesehatan_permissions.sql');
  await pool.query(fs.readFileSync(sqlPath, 'utf8'));

  const verify = await pool.query(`
    SELECT p.key
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = 'superadmin'
      AND p.key LIKE 'kesehatan.%'
    ORDER BY p.key
  `);

  console.log('=== MIGRATION 022 APPLIED ===');
  console.log('Superadmin kesehatan permissions:');
  verify.rows.forEach((row) => console.log(' -', row.key));

  if (verify.rows.length < 2) {
    console.error('\nFAIL: expected kesehatan.view and kesehatan.manage');
    process.exit(1);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
