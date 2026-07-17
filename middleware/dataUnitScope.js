const pool = require("../db");

// Legacy users without a unit assignment keep tenant-wide access for compatibility.
async function getScopedKelasIds(req, client = pool) {
  if (req.user?.role === "superadmin" || !req.user?.id || !req.tenantId) return null;
  const result = await client.query(
    `SELECT DISTINCT k.id AS kelas_id
     FROM user_unit_scope us
     INNER JOIN kelas k ON k.unit_id = us.unit_id AND k.tenant_id = $2
     WHERE us.user_id = $1`,
    [req.user.id, req.tenantId],
  );
  return result.rows.length ? result.rows.map((row) => row.kelas_id) : null;
}

async function getScopedUnitIds(req, client = pool) {
  if (req.user?.role === "superadmin" || !req.user?.id || !req.tenantId) return null;
  const result = await client.query(
    `SELECT unit_id FROM user_unit_scope WHERE user_id = $1`,
    [req.user.id],
  );
  return result.rows.length ? result.rows.map((row) => row.unit_id) : null;
}

async function assertSantriInScopedUnit(req, santriId, client = pool) {
  const kelasIds = await getScopedKelasIds(req, client);
  if (!kelasIds) return { ok: true };
  const result = await client.query(
    `SELECT s.id
     FROM santri s
     WHERE s.id = $1 AND s.tenant_id = $2 AND s.kelas_id = ANY($3::int[])`,
    [santriId, req.tenantId, kelasIds],
  );
  return result.rows.length
    ? { ok: true }
    : { ok: false, error: "Data berada di luar unit operator" };
}

async function assertKelasInScopedUnit(req, kelasId, client = pool) {
  if (kelasId === null || kelasId === undefined || kelasId === "") return { ok: true };
  const kelasIds = await getScopedKelasIds(req, client);
  if (!kelasIds || kelasIds.includes(Number(kelasId))) return { ok: true };
  return { ok: false, error: "Kelas berada di luar unit operator" };
}

module.exports = { getScopedKelasIds, getScopedUnitIds, assertSantriInScopedUnit, assertKelasInScopedUnit };
