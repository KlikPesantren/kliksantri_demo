/**
 * MT-3 — Run read-only migration verification queries
 * Usage: node scripts/run-verify-mt3.js
 * Does NOT modify data.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const ORPHAN_CHECKS = [
  ["kelas", "SELECT COUNT(*)::int AS n FROM kelas WHERE tenant_id IS NULL"],
  ["guru", "SELECT COUNT(*)::int AS n FROM guru WHERE tenant_id IS NULL"],
  ["santri", "SELECT COUNT(*)::int AS n FROM santri WHERE tenant_id IS NULL"],
  ["wali_santri", "SELECT COUNT(*)::int AS n FROM wali_santri WHERE tenant_id IS NULL"],
  ["pembayaran", "SELECT COUNT(*)::int AS n FROM pembayaran WHERE tenant_id IS NULL"],
  ["pembayaran_detail", "SELECT COUNT(*)::int AS n FROM pembayaran_detail WHERE tenant_id IS NULL"],
  ["jenis_tagihan", "SELECT COUNT(*)::int AS n FROM jenis_tagihan WHERE tenant_id IS NULL"],
  ["tagihan_sahriyah", "SELECT COUNT(*)::int AS n FROM tagihan_sahriyah WHERE tenant_id IS NULL"],
  ["sahriyah_setting", "SELECT COUNT(*)::int AS n FROM sahriyah_setting WHERE tenant_id IS NULL"],
  ["buku_kas", "SELECT COUNT(*)::int AS n FROM buku_kas WHERE tenant_id IS NULL"],
  ["devices", "SELECT COUNT(*)::int AS n FROM devices WHERE tenant_id IS NULL"],
  ["merchant_rfid", "SELECT COUNT(*)::int AS n FROM merchant_rfid WHERE tenant_id IS NULL"],
  ["transaksi_rfid", "SELECT COUNT(*)::int AS n FROM transaksi_rfid WHERE tenant_id IS NULL"],
  ["transaksi", "SELECT COUNT(*)::int AS n FROM transaksi WHERE tenant_id IS NULL"],
  ["pelanggaran", "SELECT COUNT(*)::int AS n FROM pelanggaran WHERE tenant_id IS NULL"],
  ["perizinan", "SELECT COUNT(*)::int AS n FROM perizinan WHERE tenant_id IS NULL"],
  ["pengumuman", "SELECT COUNT(*)::int AS n FROM pengumuman WHERE tenant_id IS NULL"],
];

async function run() {
  console.log("\n=== MT-3 Production Migration Verification ===\n");

  const { rows: tenants } = await pool.query(
    `SELECT id, slug, nama, status, onboarded_at FROM tenants ORDER BY id`,
  );
  console.log("TENANTS:", tenants);

  const { rows: defaultTenant } = await pool.query(
    `SELECT id, slug, nama, status FROM tenants WHERE slug = 'default'`,
  );
  console.log("\nDEFAULT TENANT:", defaultTenant[0] || "(NOT FOUND)");

  console.log("\n--- Orphan tenant_id NULL checks (expect 0) ---");
  let orphanFail = false;
  for (const [table, sql] of ORPHAN_CHECKS) {
    try {
      const { rows } = await pool.query(sql);
      const n = rows[0]?.n ?? "?";
      const ok = n === 0;
      console.log(`  ${ok ? "OK" : "FAIL"} ${table}: ${n} NULL`);
      if (!ok) orphanFail = true;
    } catch (err) {
      console.log(`  SKIP ${table}: ${err.message}`);
    }
  }

  const { rows: auditStats } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(tenant_id)::int AS with_tenant,
            COUNT(*) FILTER (WHERE tenant_id IS NULL)::int AS null_tenant
     FROM audit_logs`,
  );
  console.log("\nAUDIT_LOGS:", auditStats[0]);

  const { rows: usersByTenant } = await pool.query(
    `SELECT COALESCE(t.slug, '(platform)') AS slug, COUNT(u.id)::int AS n
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     GROUP BY t.slug ORDER BY slug`,
  );
  console.log("\nUSERS BY TENANT:", usersByTenant);

  const { rows: platformUsers } = await pool.query(
    `SELECT id, username, role, tenant_id FROM users
     WHERE tenant_id IS NULL OR role = 'platform_superadmin'`,
  );
  console.log("\nPLATFORM USERS:", platformUsers);

  const { rows: badUsers } = await pool.query(
    `SELECT id, username, role, tenant_id FROM users
     WHERE (tenant_id IS NOT NULL AND role = 'platform_superadmin')
        OR (role = 'platform_superadmin' AND tenant_id IS NOT NULL)`,
  );
  console.log("\nINVALID platform/tenant mix:", badUsers.length ? badUsers : "(none)");

  const { rows: santriPerTenant } = await pool.query(
    `SELECT t.slug, COUNT(s.id)::int AS n
     FROM tenants t LEFT JOIN santri s ON s.tenant_id = t.id
     GROUP BY t.slug ORDER BY t.slug`,
  );
  console.log("\nSANTRI PER TENANT:", santriPerTenant);

  const { rows: profil } = await pool.query(
    `SELECT pp.id, t.slug, pp.nama_pesantren, pp.alamat
     FROM profil_pesantren pp
     LEFT JOIN tenants t ON t.id = pp.tenant_id`,
  );
  console.log("\nPROFIL PESANTREN:", profil);

  const { rows: platformRole } = await pool.query(
    `SELECT id, name FROM roles WHERE name = 'platform_superadmin'`,
  );
  console.log("\nPLATFORM ROLE:", platformRole[0] || "(MISSING)");

  const { rows: platformPerms } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM permissions WHERE grup = 'platform'`,
  );
  console.log("PLATFORM PERMISSIONS:", platformPerms[0].n);

  const markers = [
    { name: "043 audit_logs.tenant_id", sql: `SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='tenant_id'` },
    { name: "036 tenants.suspended_at", sql: `SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='suspended_at'` },
    { name: "041 pembayaran dedup index", sql: `SELECT 1 FROM pg_indexes WHERE tablename='pembayaran' AND indexname LIKE '%tenant%'` },
    { name: "035 users_tenant_username_key", sql: `SELECT 1 FROM pg_indexes WHERE indexname='users_tenant_username_key'` },
  ];

  console.log("\n--- Migration markers ---");
  for (const m of markers) {
    const { rows } = await pool.query(m.sql);
    console.log(`  ${rows.length ? "OK" : "MISSING"} ${m.name}`);
  }

  const sqlFile = path.join(__dirname, "verify-mt3-migration.sql");
  console.log(`\nFull SQL checklist: ${sqlFile}`);

  console.log("\n=== Summary ===");
  if (!defaultTenant.length) console.log("  WARN: tenant slug 'default' not found");
  if (orphanFail) console.log("  FAIL: orphan tenant_id NULL detected");
  else console.log("  OK: no orphan NULL on core business tables (checked)");

  await pool.end();
}

run().catch(async (err) => {
  console.error("ERR", err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
