const pool = require('../db');

async function main() {
  const table = await pool.query(
    "SELECT to_regclass('public.kesehatan_santri') AS tbl"
  );
  const perms = await pool.query(
    "SELECT key FROM permissions WHERE key LIKE 'kesehatan.%' ORDER BY key"
  );
  const rolePerms = await pool.query(`
    SELECT r.name, array_agg(p.key ORDER BY p.key) AS perms
    FROM roles r
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE p.key LIKE 'kesehatan.%'
    GROUP BY r.name
    ORDER BY r.name
  `);
  const superadminKesehatan = await pool.query(`
    SELECT COUNT(*)::int AS cnt
    FROM roles r
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = 'superadmin' AND p.key LIKE 'kesehatan.%'
  `);
  const totalPerms = await pool.query('SELECT COUNT(*)::int AS total FROM permissions');
  const superadminTotal = await pool.query(`
    SELECT COUNT(*)::int AS total
    FROM roles r
    JOIN role_permissions rp ON rp.role_id = r.id
    WHERE r.name = 'superadmin'
  `);

  console.log(JSON.stringify({
    table: table.rows[0].tbl,
    kesehatan_permissions: perms.rows,
    role_kesehatan_permissions: rolePerms.rows,
    superadmin_kesehatan_count: superadminKesehatan.rows[0].cnt,
    total_permissions: totalPerms.rows[0].total,
    superadmin_permission_count: superadminTotal.rows[0].total,
  }, null, 2));

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
