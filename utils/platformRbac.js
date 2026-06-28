const PLATFORM_ROLE = "platform_superadmin";

const TENANT_ROLE_DENIED =
  "Role tidak diizinkan untuk tenant.";

const TENANT_RBAC_READ_ONLY =
  "Manajemen role dinonaktifkan untuk tenant. Hubungi admin platform untuk perubahan hak akses global.";

/**
 * Role bawaan sistem yang boleh dilihat & di-assign tenant admin.
 * Tidak termasuk platform_superadmin dan role custom tenant.
 */
const TENANT_ASSIGNABLE_ROLES = new Set([
  "superadmin",
  "pendidikan",
  "keuangan",
  "keamanan",
  "sekretaris",
  "pimpinan_yayasan",
  "bendahara_unit",
]);

function isPlatformRole(roleName) {
  return String(roleName || "").trim() === PLATFORM_ROLE;
}

function isPlatformPermission(permKey) {
  return String(permKey || "").trim().startsWith("platform.");
}

function isTenantAssignableRole(roleName) {
  const normalized = String(roleName || "").trim().toLowerCase();
  return TENANT_ASSIGNABLE_ROLES.has(normalized);
}

function getTenantCustomRolePrefix(tenantId) {
  return `tenant_${tenantId}_`;
}

function isTenantCustomRole(roleName, tenantId) {
  const normalized = String(roleName || "").trim().toLowerCase();
  return normalized.startsWith(getTenantCustomRolePrefix(tenantId));
}

function normalizeTenantCustomRoleName(tenantId, rawName) {
  const slug = String(rawName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!slug) return "";

  const prefix = getTenantCustomRolePrefix(tenantId);
  return slug.startsWith(prefix) ? slug : `${prefix}${slug}`;
}

function filterTenantRoles(rows) {
  return (rows || []).filter(
    (row) => !isPlatformRole(row.name) && isTenantAssignableRole(row.name),
  );
}

function filterTenantPermissions(rows) {
  return (rows || []).filter((row) => !isPlatformPermission(row.key));
}

function filterTenantPermissionKeys(keys) {
  return (keys || []).filter((key) => !isPlatformPermission(key));
}

function rejectPlatformRoleAssignment(roleName) {
  if (isPlatformRole(roleName)) {
    return {
      ok: false,
      status: 403,
      error: TENANT_ROLE_DENIED,
    };
  }
  return { ok: true };
}

function validateTenantAssignableRole(roleName) {
  const platformCheck = rejectPlatformRoleAssignment(roleName);
  if (!platformCheck.ok) {
    return platformCheck;
  }

  if (!isTenantAssignableRole(roleName)) {
    return {
      ok: false,
      status: 403,
      error: TENANT_ROLE_DENIED,
    };
  }

  return { ok: true };
}

function validateTenantRoleForAssignment(roleName, tenantId) {
  const platformCheck = rejectPlatformRoleAssignment(roleName);
  if (!platformCheck.ok) {
    return platformCheck;
  }

  if (isTenantAssignableRole(roleName) || isTenantCustomRole(roleName, tenantId)) {
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    error: TENANT_ROLE_DENIED,
  };
}

function rejectTenantRoleMutation() {
  return {
    ok: false,
    status: 403,
    error: TENANT_RBAC_READ_ONLY,
  };
}

function tenantAssignableRolesSqlList() {
  return [...TENANT_ASSIGNABLE_ROLES];
}

module.exports = {
  PLATFORM_ROLE,
  TENANT_ROLE_DENIED,
  TENANT_RBAC_READ_ONLY,
  TENANT_ASSIGNABLE_ROLES,
  isPlatformRole,
  isPlatformPermission,
  isTenantAssignableRole,
  filterTenantRoles,
  filterTenantPermissions,
  filterTenantPermissionKeys,
  rejectPlatformRoleAssignment,
  validateTenantAssignableRole,
  validateTenantRoleForAssignment,
  rejectTenantRoleMutation,
  tenantAssignableRolesSqlList,
  getTenantCustomRolePrefix,
  isTenantCustomRole,
  normalizeTenantCustomRoleName,
};
