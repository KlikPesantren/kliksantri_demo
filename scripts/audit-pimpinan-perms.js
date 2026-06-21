require("dotenv").config();
const pool = require("../db");

const REQUIRED = [
  "dashboard.view",
  "santri.view", "wali.view", "guru.view", "kelas.view",
  "absensi.view", "hafalan.view", "nilai.view",
  "pelanggaran.view", "perizinan.view",
  "pembayaran.view", "bukukas.view",
  "kas_instansi.view", "kas_instansi.konsolidasi",
  "program_unit.view",
];

const FORBIDDEN_SUFFIX = [".create", ".update", ".delete", ".manage"];
const FORBIDDEN_EXACT = ["role.manage", "user.manage", "rfid.manage"];

async function run() {
  const perms = await pool.query(`
    SELECT p.key, p.grup
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = 'pimpinan_yayasan'
    ORDER BY p.key
  `);
  const keys = perms.rows.map((r) => r.key);
  console.log("CURRENT (" + keys.length + "):", keys.join(", "));
  console.log("\nMISSING:", REQUIRED.filter((k) => !keys.includes(k)));
  console.log("EXTRA (not in required):", keys.filter((k) => !REQUIRED.includes(k)));
  const bad = keys.filter(
    (k) =>
      FORBIDDEN_EXACT.includes(k) ||
      FORBIDDEN_SUFFIX.some((s) => k.endsWith(s.replace(".", ".")) && k.includes(s))
  );
  console.log("FORBIDDEN:", bad);
  await pool.end();
}

run().catch(console.error);
