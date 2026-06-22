/**
 * Run migration 042 — scale list query indexes
 * Usage: node scripts/run-migration-042.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const EXPECTED_INDEXES = [
  "idx_pembayaran_tenant_bulan_tahun_status",
  "idx_pembayaran_tenant_jenis_tagihan",
  "idx_pembayaran_tenant_santri",
  "idx_tagihan_sahriyah_tenant_bulan_tahun",
  "idx_tagihan_sahriyah_tenant_santri",
  "idx_transaksi_rfid_tenant_santri",
  "idx_transaksi_rfid_tenant_merchant",
  "idx_santri_tenant_nama",
];

async function run() {
  const sqlPath = path.join(__dirname, "../migrations/042_scale_list_indexes.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 042 OK");

  const { rows } = await pool.query(
    `SELECT indexname FROM pg_indexes
     WHERE indexname = ANY($1::text[])
     ORDER BY indexname`,
    [EXPECTED_INDEXES],
  );
  console.log("indexes present:", rows.map((r) => r.indexname));

  const missing = EXPECTED_INDEXES.filter(
    (name) => !rows.some((r) => r.indexname === name),
  );
  if (missing.length) {
    console.error("FAIL: missing indexes:", missing);
    process.exit(1);
  }

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
