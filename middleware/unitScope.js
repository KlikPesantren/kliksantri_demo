const pool = require("../db");
const requirePermission = require("./requirePermission");

/**
 * Resolve unit access for the authenticated user within active tenant.
 */
async function resolveUnitAccess(req) {
  const role = req.user?.role;
  const userId = req.user?.id;
  const tenantId = req.tenantId;

  if (!role || !userId) {
    return {
      denied: true,
      status: 401,
      error: "Tidak terautentikasi",
    };
  }

  if (!tenantId) {
    return {
      denied: true,
      status: 403,
      error: "Tenant context tidak tersedia",
    };
  }

  if (role === "superadmin") {
    return {
      mode: "ALL",
      unitIds: null,
      canManage: true,
      tenantId,
    };
  }

  if (role === "pimpinan_yayasan") {
    return {
      mode: "ALL",
      unitIds: null,
      canManage: false,
      tenantId,
    };
  }

  const perms = await requirePermission.getPermissionList(role, {
    tenantScoped: true,
  });
  const canView = perms.includes("kas_instansi.view");
  const canManage = perms.includes("kas_instansi.manage");

  if (!canView && !canManage) {
    return {
      denied: true,
      status: 403,
      error: "Akses ditolak",
    };
  }

  const { rows } = await pool.query(
    `SELECT s.unit_id
     FROM user_unit_scope s
     INNER JOIN users usr ON usr.id = s.user_id AND usr.tenant_id = $2
     INNER JOIN unit_pendidikan u ON u.id = s.unit_id AND u.tenant_id = $2
     WHERE s.user_id = $1`,
    [userId, tenantId]
  );

  if (rows.length === 0) {
    return {
      denied: true,
      status: 403,
      error: "Unit scope belum diassign",
    };
  }

  return {
    mode: "SCOPED",
    unitIds: rows.map((r) => r.unit_id),
    canManage,
    tenantId,
  };
}

async function getUnitByKode(kode, tenantId) {
  const { rows } = await pool.query(
    `SELECT id, kode, nama, is_active, tenant_id
     FROM unit_pendidikan
     WHERE UPPER(kode) = UPPER($1)
       AND tenant_id = $2`,
    [kode, tenantId]
  );
  return rows[0] || null;
}

function isUnitAllowed(access, unitId) {
  if (access.mode === "ALL") {
    return true;
  }
  return Array.isArray(access.unitIds) && access.unitIds.includes(unitId);
}

function unitScopeSql(access, unitColumn, startParamIndex) {
  if (access.mode === "ALL") {
    return { clause: "", params: [], nextIndex: startParamIndex };
  }

  return {
    clause: ` AND ${unitColumn} = ANY($${startParamIndex}::int[])`,
    params: [access.unitIds],
    nextIndex: startParamIndex + 1,
  };
}

module.exports = {
  resolveUnitAccess,
  getUnitByKode,
  isUnitAllowed,
  unitScopeSql,
};
