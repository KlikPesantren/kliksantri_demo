/**
 * Smoke — tahun_berdiri profil pesantren
 * Usage: node scripts/smoke-tahun-berdiri.js
 */
require("dotenv").config();
const pool = require("../db");

const BASE = process.env.BANNER_DEBUG_BASE || "http://10.25.150.36:3000";
const TENANT = process.env.SMOKE_TENANT_SLUG || "default";

async function loginAdmin() {
  const { rows } = await pool.query(
    `SELECT u.username FROM users u
     JOIN tenants t ON t.id = u.tenant_id
     WHERE t.slug = $1 AND u.status = 'Aktif' LIMIT 1`,
    [TENANT]
  );
  const username = rows[0]?.username;
  if (!username) throw new Error("no admin user");
  for (const pwd of [process.env.SMOKE_ADMIN_PASSWORD, "admin123", "456789", "password"]) {
    if (!pwd) continue;
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: pwd, tenant_slug: TENANT }),
    });
    const body = await res.json();
    if (body.token) return body.token;
  }
  throw new Error("admin login failed");
}

async function loginWali() {
  const res = await fetch(`${BASE}/wali-app/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: TENANT,
      nomor_hp: process.env.SMOKE_WALI_HP || "085215914881",
      pin: process.env.SMOKE_WALI_PIN || "456789",
    }),
  });
  const body = await res.json();
  if (!body.token) throw new Error("wali login failed");
  return body.token;
}

async function main() {
  let pass = 0;
  const ok = (m) => {
    pass++;
    console.log("PASS:", m);
  };

  const adminToken = await loginAdmin();
  const getRes = await fetch(`${BASE}/profil-pesantren`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const getBody = await getRes.json();
  const profil = getBody.data;
  if (!profil) throw new Error("no profil");

  if ("tahun_berdiri" in profil) ok("GET /profil-pesantren has tahun_berdiri");

  const putRes = await fetch(`${BASE}/profil-pesantren`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...profil,
      nama_pesantren: profil.nama_pesantren,
      tahun_berdiri: 1998,
    }),
  });
  const putBody = await putRes.json();
  if (putBody.data?.tahun_berdiri === 1998) ok("PUT saves tahun_berdiri=1998");

  const waliToken = await loginWali();
  const waliRes = await fetch(`${BASE}/wali-app/profil-pesantren`, {
    headers: { Authorization: `Bearer ${waliToken}` },
  });
  const waliBody = await waliRes.json();
  if (waliBody.data?.tahun_berdiri === 1998) ok("GET /wali-app/profil-pesantren has tahun_berdiri");

  console.log(`\nSMOKE: ${pass}/3`);
}

main()
  .catch((e) => {
    console.error("FAIL:", e.message);
    process.exit(1);
  })
  .finally(() => pool.end());
