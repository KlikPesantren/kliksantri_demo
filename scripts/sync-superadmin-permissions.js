/**
 * Sync all permissions in `permissions` table to role `superadmin`.
 * Run after adding new permissions via migration to prevent RBAC gaps.
 *
 * Usage: node scripts/sync-superadmin-permissions.js
 */
const pool = require('../db');

async function syncSuperadminPermissions() {
  const result = await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'superadmin'
    ON CONFLICT DO NOTHING
    RETURNING permission_id
  `);

  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM permissions) AS total_permissions,
      (SELECT COUNT(*)::int
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       WHERE r.name = 'superadmin') AS superadmin_permissions
  `);

  return {
    inserted: result.rowCount,
    ...counts.rows[0],
  };
}

async function main() {
  const summary = await syncSuperadminPermissions();

  console.log('=== SYNC SUPERADMIN PERMISSIONS ===');
  console.log(`New rows inserted : ${summary.inserted}`);
  console.log(`Total permissions : ${summary.total_permissions}`);
  console.log(`Superadmin has    : ${summary.superadmin_permissions}`);

  if (summary.superadmin_permissions < summary.total_permissions) {
    console.error(
      '\nWARNING: superadmin still missing permissions — check roles/permissions tables.'
    );
    process.exit(1);
  }

  console.log('\nOK — superadmin owns all permissions.');
  await pool.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { syncSuperadminPermissions };
