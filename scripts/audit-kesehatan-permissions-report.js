/**
 * Audit grup permission kesehatan — id, key, roles.
 * Usage: node scripts/audit-kesehatan-permissions-report.js
 */
const pool = require('../db');

async function main() {
  const { rows } = await pool.query(`
    SELECT
      p.id,
      p.key,
      p.label,
      COALESCE(
        array_agg(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL),
        '{}'
      ) AS roles
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_id = p.id
    LEFT JOIN roles r ON r.id = rp.role_id
    WHERE p.grup = 'kesehatan'
    GROUP BY p.id, p.key, p.label
    ORDER BY p.id
  `);

  console.log('=== AUDIT: GRUP KESEHATAN ===\n');
  console.log(JSON.stringify(rows, null, 2));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
