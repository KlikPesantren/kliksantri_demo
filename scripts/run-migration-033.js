/**
 * Run migration 033 — RFID tenant scope
 * Usage: node scripts/run-migration-033.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const TABLES = [
  "merchant_rfid",
  "devices",
  "transaksi_rfid",
  "transaksi",
  "rfid_sync_queue",
  "rfid_limit_settings",
  "rfid_limit_override",
  "rfid_override_logs",
];

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/033_rfid_tenant.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 033 OK");

  for (const table of TABLES) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total, COUNT(tenant_id)::int AS with_tenant FROM ${table}`
    );
    console.log(`${table}:`, rows[0]);
    if (rows[0].total !== rows[0].with_tenant) {
      console.error(`VALIDATION FAIL: ${table}`);
      process.exit(1);
    }
  }

  const checks = [
    {
      label: "transaksi_rfid vs santri tenant",
      sql: `SELECT COUNT(*)::int AS n FROM transaksi_rfid tr
            JOIN santri s ON s.id = tr.santri_id
            WHERE tr.tenant_id <> s.tenant_id`,
    },
    {
      label: "transaksi vs santri tenant",
      sql: `SELECT COUNT(*)::int AS n FROM transaksi tx
            JOIN santri s ON s.id = tx.santri_id
            WHERE tx.tenant_id <> s.tenant_id`,
    },
    {
      label: "device vs merchant tenant",
      sql: `SELECT COUNT(*)::int AS n FROM devices d
            JOIN merchant_rfid m ON m.id = d.merchant_id
            WHERE d.tenant_id <> m.tenant_id`,
    },
    {
      label: "rfid_sync_queue vs devices tenant",
      sql: `SELECT COUNT(*)::int AS n FROM rfid_sync_queue q
            JOIN devices d ON d.id = q.device_id
            WHERE q.tenant_id <> d.tenant_id`,
    },
  ];

  for (const c of checks) {
    const { rows } = await pool.query(c.sql);
    console.log(`${c.label}:`, rows[0].n);
    if (rows[0].n !== 0) {
      console.error(`VALIDATION FAIL: ${c.label}`);
      process.exit(1);
    }
  }

  const { rows: constraints } = await pool.query(`
    SELECT conname FROM pg_constraint
    WHERE conname IN (
      'devices_tenant_device_id_key',
      'transaksi_rfid_tenant_trx_uuid_key',
      'rfid_sync_queue_tenant_trx_uuid_key',
      'rfid_limit_settings_tenant_santri_key'
    )
  `);
  if (constraints.length < 4) {
    console.error("VALIDATION FAIL: composite constraints", constraints);
    process.exit(1);
  }

  console.log("Validation: Step 2D schema OK");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
