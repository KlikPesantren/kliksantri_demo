/**
 * Audit Step 2 Final — cross-unit & auth proofs
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_API_BASE || "http://localhost:3000";

async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

async function api(token, method, path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, body };
}

async function main() {
  const hash = await bcrypt.hash("test1234", 10);
  await pool.query(
    `INSERT INTO users (nama, username, password, role, status)
     VALUES ('Bendahara PAUD Test', 'bendahara_paud_test', $1, 'bendahara_unit', 'Aktif')
     ON CONFLICT (username) DO UPDATE SET role = 'bendahara_unit', password = EXCLUDED.password`,
    [hash]
  );

  const paud = await pool.query("SELECT id FROM unit_pendidikan WHERE kode = 'PAUD'");
  const madin = await pool.query("SELECT id FROM unit_pendidikan WHERE kode = 'MADIN'");
  const bendahara = await pool.query(
    "SELECT id FROM users WHERE username = 'bendahara_paud_test'"
  );

  await pool.query(
    `INSERT INTO user_unit_scope (user_id, unit_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [bendahara.rows[0].id, paud.rows[0].id]
  );

  const madinTx = await pool.query(
    `INSERT INTO kas_instansi_transaksi (unit_id, tanggal, jenis, kategori, keterangan, nominal, petugas)
     VALUES ($1, '2026-06-12', 'Masuk', 'Audit MADIN', 'cross-unit test', 99999, 'System')
     RETURNING id, unit_id`,
    [madin.rows[0].id]
  );
  const madinTxId = madinTx.rows[0].id;

  const paudTx = await pool.query(
    `INSERT INTO kas_instansi_transaksi (unit_id, tanggal, jenis, kategori, keterangan, nominal, petugas)
     VALUES ($1, '2026-06-12', 'Masuk', 'Audit PAUD', 'cross-unit test', 11111, 'System')
     RETURNING id, unit_id`,
    [paud.rows[0].id]
  );
  const paudTxId = paudTx.rows[0].id;

  const admin = await login("admin", "admin123");
  const bendaharaLogin = await login("bendahara_paud_test", "test1234");

  console.log("=== AUDIT 4: Bendahara PAUD manual URL MADIN ===");
  const r4a = await api(
    bendaharaLogin.token,
    "GET",
    "/kas-instansi/MADIN/transaksi?bulan=6&tahun=2026"
  );
  console.log("GET /kas-instansi/MADIN/transaksi →", r4a.status, r4a.body?.error);

  const r4b = await api(
    bendaharaLogin.token,
    "PUT",
    `/kas-instansi/MADIN/transaksi/${madinTxId}`,
    {
      tanggal: "2026-06-12",
      jenis: "Masuk",
      kategori: "Hack",
      nominal: 1,
    }
  );
  console.log(
    `PUT /kas-instansi/MADIN/transaksi/${madinTxId} →`,
    r4b.status,
    r4b.body?.error
  );

  console.log("\n=== AUDIT 6: PAUD URL cannot mutate MADIN tx id ===");
  const r6a = await api(
    bendaharaLogin.token,
    "PUT",
    `/kas-instansi/PAUD/transaksi/${madinTxId}`,
    {
      tanggal: "2026-06-12",
      jenis: "Masuk",
      kategori: "Cross hack",
      nominal: 1,
    }
  );
  console.log(
    `PUT /kas-instansi/PAUD/transaksi/${madinTxId} (MADIN row) →`,
    r6a.status,
    r6a.body?.error
  );

  const madinBefore = await pool.query(
    "SELECT kategori, nominal FROM kas_instansi_transaksi WHERE id = $1",
    [madinTxId]
  );
  console.log("MADIN row after PAUD-path PUT:", madinBefore.rows[0]);

  const r6b = await api(
    bendaharaLogin.token,
    "DELETE",
    `/kas-instansi/PAUD/transaksi/${madinTxId}`
  );
  console.log(
    `DELETE /kas-instansi/PAUD/transaksi/${madinTxId} (MADIN row) →`,
    r6b.status,
    r6b.body?.error
  );

  const madinStill = await pool.query(
    "SELECT id FROM kas_instansi_transaksi WHERE id = $1",
    [madinTxId]
  );
  console.log("MADIN row still exists:", madinStill.rows.length === 1);

  console.log("\n=== AUDIT 5: Superadmin can edit any unit ===");
  const r5 = await api(
    admin.token,
    "PUT",
    `/kas-instansi/MADIN/transaksi/${madinTxId}`,
    {
      tanggal: "2026-06-12",
      jenis: "Masuk",
      kategori: "Superadmin edit",
      nominal: 88888,
      petugas: "Admin",
    }
  );
  console.log(`PUT /kas-instansi/MADIN/transaksi/${madinTxId} superadmin →`, r5.status);
  console.log("Updated kategori:", r5.body?.data?.kategori);

  const r5b = await api(
    admin.token,
    "PUT",
    `/kas-instansi/SMP/transaksi/999999`,
    {
      tanggal: "2026-06-12",
      jenis: "Masuk",
      kategori: "X",
      nominal: 1000,
    }
  );
  console.log("PUT nonexistent SMP tx →", r5b.status, r5b.body?.error);

  console.log("\n=== AUDIT 1: No token ===");
  const r1 = await fetch(`${BASE}/kas-instansi/units`);
  console.log("GET /units without token →", r1.status);

  await pool.query("DELETE FROM kas_instansi_transaksi WHERE id IN ($1, $2)", [
    madinTxId,
    paudTxId,
  ]);

  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
