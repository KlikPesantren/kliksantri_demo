/**
 * Run migration 037 — dashboard index optimization
 * Usage: node scripts/run-migration-037.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const EXPECTED_INDEXES = [
  "idx_buku_kas_tenant_tanggal",
  "idx_tagihan_sahriyah_tenant_status",
  "idx_transaksi_rfid_tenant_created",
  "idx_absensi_tenant_tanggal",
  "idx_pelanggaran_tenant_tanggal",
  "idx_absensi_guru_tenant_bulan_tahun",
];

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/037_dashboard_indexes.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 037 OK");

  const { rows } = await pool.query(
    `SELECT indexname FROM pg_indexes
     WHERE indexname = ANY($1::text[])
     ORDER BY indexname`,
    [EXPECTED_INDEXES]
  );
  console.log("indexes present:", rows.map((r) => r.indexname));

  const missing = EXPECTED_INDEXES.filter(
    (name) => !rows.some((r) => r.indexname === name)
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
