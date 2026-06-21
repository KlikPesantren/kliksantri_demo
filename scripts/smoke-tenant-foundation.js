/**
 * Smoke test — Multi-Tenant Step 1 foundation
 * Usage: node scripts/smoke-tenant-foundation.js
 */
require("dotenv").config();
const jwt = require("jsonwebtoken");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const ADMIN_USER = process.env.SMOKE_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.SMOKE_ADMIN_PASS || "admin123";

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log("  PASS:", label);
}

function fail(label, detail) {
  failed++;
  console.error("  FAIL:", label, detail || "");
}

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function run() {
  console.log("=== Smoke: Tenant Foundation (Step 1) ===\n");

  const { rows: tenants } = await pool.query(
    `SELECT id, slug, nama FROM tenants WHERE slug = 'default'`
  );
  if (tenants.length === 1) ok("DB: default tenant exists");
  else fail("DB: default tenant exists", tenants);

  const { rows: users } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM users WHERE tenant_id IS NULL`
  );
  if (users[0].n === 0) ok("DB: all users have tenant_id");
  else fail("DB: all users have tenant_id", users[0]);

  const loginRes = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });

  if (loginRes.res.status === 200 && loginRes.body.success) ok("POST /auth/login");
  else fail("POST /auth/login", loginRes.body);

  const token = loginRes.body.token;
  const user = loginRes.body.user;

  if (user?.tenant_id) ok("Login response includes tenant_id");
  else fail("Login response includes tenant_id", user);

  if (user?.tenant_slug === "default") ok("Login response tenant_slug = default");
  else fail("Login response tenant_slug = default", user?.tenant_slug);

  const decoded = jwt.decode(token);
  if (decoded?.tenant_id && decoded?.tenant_slug) ok("JWT payload has tenant_id + tenant_slug");
  else fail("JWT payload has tenant_id + tenant_slug", decoded);

  const meRes = await fetchJson("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (meRes.res.status === 200 && meRes.body.user?.tenant_id) ok("GET /auth/me returns tenant");
  else fail("GET /auth/me returns tenant", meRes.body);

  const usersRes = await fetchJson("/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (usersRes.res.status === 200 && Array.isArray(usersRes.body.data)) {
    const allSameTenant = usersRes.body.data.every(
      (u) => u.tenant_id === user.tenant_id
    );
    if (allSameTenant) ok("GET /users scoped to tenant");
    else fail("GET /users scoped to tenant");
  } else {
    fail("GET /users", usersRes.body);
  }

  const badTenant = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: ADMIN_USER,
      password: ADMIN_PASS,
      tenant_slug: "nonexistent-tenant-xyz",
    }),
  });
  if (badTenant.res.status === 404) ok("Login rejects unknown tenant_slug");
  else fail("Login rejects unknown tenant_slug", badTenant.body);

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
