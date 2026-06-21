/**
 * Run migration 024 — expand unit_pendidikan to 7 units
 * Usage: node scripts/run-migration-024.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function snapshotUnits(label) {
  const { rows } = await pool.query(
    `SELECT id, kode, nama, is_active, sort_order
     FROM unit_pendidikan
     ORDER BY sort_order, id`
  );
  console.log(`\n=== ${label} ===`);
  console.table(rows);
  return rows;
}

async function snapshotRelations(label) {
  const tx = await pool.query(
    `SELECT t.unit_id, u.kode, COUNT(*)::int AS cnt
     FROM kas_instansi_transaksi t
     LEFT JOIN unit_pendidikan u ON u.id = t.unit_id
     GROUP BY t.unit_id, u.kode
     ORDER BY t.unit_id`
  );
  const scope = await pool.query(
    `SELECT s.user_id, s.unit_id, u.kode
     FROM user_unit_scope s
     LEFT JOIN unit_pendidikan u ON u.id = s.unit_id
     ORDER BY s.user_id, s.unit_id`
  );
  console.log(`\n--- ${label}: kas_instansi_transaksi ---`);
  console.table(tx.rows);
  console.log(`--- ${label}: user_unit_scope ---`);
  console.table(scope.rows);
}

async function run() {
  const backupDir = path.join(__dirname, "../backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const beforeUnits = await snapshotUnits("BEFORE unit_pendidikan");
  await snapshotRelations("BEFORE relations");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `unit_pendidikan_pre_024_${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify({ captured_at: new Date().toISOString(), units: beforeUnits }, null, 2)
  );
  console.log(`\nBackup written: ${backupPath}`);

  const sqlPath = path.join(__dirname, "../migrations/024_expand_unit_pendidikan.sql");
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("\nMigration 024 OK");

  const afterUnits = await snapshotUnits("AFTER unit_pendidikan");
  await snapshotRelations("AFTER relations");

  const expected = ["PAUD", "TK", "SD", "MI", "SMP", "SMA", "MADINAH"];
  const activeKodes = afterUnits.filter((u) => u.is_active).map((u) => u.kode);
  const missing = expected.filter((k) => !activeKodes.includes(k));
  const extra = activeKodes.filter((k) => !expected.includes(k));

  if (missing.length > 0 || extra.length > 0) {
    console.error("VALIDATION FAIL", { missing, extra });
    process.exit(1);
  }

  const sorted = [...afterUnits]
    .filter((u) => u.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((u) => u.kode);
  if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
    console.error("SORT ORDER FAIL", { expected, got: sorted });
    process.exit(1);
  }

  console.log("\nValidation: 7 units present with correct sort_order");
  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
