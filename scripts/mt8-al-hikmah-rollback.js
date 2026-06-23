/**
 * MT-8 Rollback — hapus tenant simulasi al-hikmah (safe)
 * Usage: node scripts/mt8-al-hikmah-rollback.js
 * Requires: MT8_CONFIRM=1
 */
require("dotenv").config();
const pool = require("../db");

const SLUG = "al-hikmah";

async function run() {
  if (process.env.MT8_CONFIRM !== "1") {
    console.error("Set MT8_CONFIRM=1 untuk menjalankan rollback tenant simulasi.");
    process.exit(1);
  }

  const { rows } = await pool.query(
    `SELECT id, nama FROM tenants WHERE slug = $1`,
    [SLUG]
  );
  if (!rows.length) {
    console.log("Tenant al-hikmah tidak ditemukan — tidak ada yang dihapus.");
    await pool.end();
    return;
  }

  const tenantId = rows[0].id;
  console.log(`Menghapus tenant simulasi: ${rows[0].nama} (id=${tenantId})`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM wali_santri WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM santri WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM guru WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM kelas WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM tenant_features WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM profil_pesantren WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM unit_pendidikan WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);

    await client.query("COMMIT");
    console.log("Rollback selesai. Tenant default (Anwarul Huda) tidak disentuh.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Rollback gagal:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
