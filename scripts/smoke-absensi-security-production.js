/* eslint-disable no-console */
require("dotenv").config();
if (process.env.NODE_ENV !== "production") throw new Error("NODE_ENV=production required");

const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET } = require("../config/authSecrets");
const API_BASE = String(process.env.SMOKE_API_BASE || "https://api.klikpesantren.com").replace(/\/$/, "");

function tokenFor(user) {
  return jwt.sign({
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    tenant_id: user.tenant_id,
    tenant_slug: user.tenant_slug,
    token_version: Number(user.token_version || 0),
  }, JWT_SECRET, { expiresIn: "10m" });
}

async function call(body, token, unitId) {
  const headers = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (unitId) headers["x-unit-id"] = String(unitId);
  const response = await fetch(`${API_BASE}/absensi/batch`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function main() {
  const { rows: fixtures } = await pool.query(`
    SELECT a.tenant_id, a.unit_id, a.santri_id, TO_CHAR(a.tanggal, 'YYYY-MM-DD') tanggal,
           a.session_id, a.status
    FROM absensi a
    JOIN attendance_sessions ats ON ats.tenant_id=a.tenant_id AND ats.unit_id=a.unit_id
      AND ats.id=a.session_id AND ats.active=true
    JOIN santri_units su ON su.tenant_id=a.tenant_id AND su.unit_id=a.unit_id
      AND su.santri_id=a.santri_id AND su.status='active' AND su.left_at IS NULL
    WHERE a.unit_id IS NOT NULL ORDER BY a.id DESC LIMIT 1
  `);
  if (!fixtures[0]) throw new Error("NO_SAFE_FIXTURE");
  const fixture = fixtures[0];
  const entry = {
    santri_id: fixture.santri_id,
    tanggal: fixture.tanggal,
    session_id: Number(fixture.session_id),
    status: fixture.status,
  };

  const { rows: superadmins } = await pool.query(`
    SELECT u.*, t.slug tenant_slug FROM users u JOIN tenants t ON t.id=u.tenant_id
    WHERE u.tenant_id=$1 AND u.role='superadmin' AND LOWER(BTRIM(u.status)) IN ('aktif','active')
    ORDER BY u.id LIMIT 1
  `, [fixture.tenant_id]);
  if (!superadmins[0]) throw new Error("NO_ACTIVE_SUPERADMIN");
  const token = tokenFor(superadmins[0]);

  const noAuth = await call({ unit_id: fixture.unit_id, entries: [entry] }, null, fixture.unit_id);
  const noUnit = await call({ entries: [entry] }, token, null);

  const { rows: crossTenantUnits } = await pool.query(`
    SELECT id FROM unit_pendidikan WHERE tenant_id <> $1 AND is_active=true ORDER BY id LIMIT 1
  `, [fixture.tenant_id]);
  const crossTenant = crossTenantUnits[0]
    ? await call({ unit_id: crossTenantUnits[0].id, entries: [entry] }, token, crossTenantUnits[0].id)
    : null;

  const { rows: sameTenantUnits } = await pool.query(`
    SELECT id FROM unit_pendidikan WHERE tenant_id=$1 AND id<>$2 AND is_active=true ORDER BY id LIMIT 1
  `, [fixture.tenant_id, fixture.unit_id]);
  const foreignSession = sameTenantUnits[0]
    ? await call({ unit_id: sameTenantUnits[0].id, entries: [entry] }, token, sameTenantUnits[0].id)
    : null;

  const { rows: operatorCandidates } = await pool.query(`
    SELECT u.*, t.slug tenant_slug, foreign_unit.id foreign_unit_id
    FROM users u
    JOIN tenants t ON t.id=u.tenant_id
    JOIN LATERAL (
      SELECT up.id FROM unit_pendidikan up
      WHERE up.tenant_id=u.tenant_id AND up.is_active=true
        AND NOT EXISTS (
          SELECT 1 FROM user_unit_scope scope
          WHERE scope.tenant_id=u.tenant_id AND scope.user_id=u.id
            AND scope.unit_id=up.id AND scope.status='active'
        )
      ORDER BY up.id LIMIT 1
    ) foreign_unit ON TRUE
    WHERE u.role <> 'superadmin' AND LOWER(BTRIM(u.status)) IN ('aktif','active')
    ORDER BY u.id LIMIT 1
  `);
  const operatorForeignUnit = operatorCandidates[0]
    ? await call(
      { unit_id: operatorCandidates[0].foreign_unit_id, entries: [entry] },
      tokenFor(operatorCandidates[0]),
      operatorCandidates[0].foreign_unit_id,
    )
    : null;

  if (noAuth.status !== 401) throw new Error(`UNAUTHORIZED_EXPECTED_401_GOT_${noAuth.status}`);
  if (noUnit.status !== 400 || noUnit.body?.code !== "UNIT_REQUIRED") throw new Error("NO_UNIT_GATE_FAILED");
  if (crossTenant && ![403, 404].includes(crossTenant.status)) throw new Error("CROSS_TENANT_GATE_FAILED");
  if (foreignSession && foreignSession.status !== 403) throw new Error("FOREIGN_SESSION_GATE_FAILED");
  if (operatorForeignUnit && operatorForeignUnit.status !== 403) throw new Error("OPERATOR_FOREIGN_UNIT_GATE_FAILED");

  console.log(JSON.stringify({
    unauthorized: { status: noAuth.status, code: noAuth.body?.code || null },
    noUnit: { status: noUnit.status, code: noUnit.body?.code },
    crossTenant: crossTenant && { status: crossTenant.status, code: crossTenant.body?.code },
    foreignSession: foreignSession && { status: foreignSession.status, code: foreignSession.body?.code },
    operatorForeignUnit: operatorForeignUnit && { status: operatorForeignUnit.status, code: operatorForeignUnit.body?.code },
    writesAttemptedAfterValidation: 0,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());
