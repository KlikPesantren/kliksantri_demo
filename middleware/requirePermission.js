const pool = require("../db");

// Cache in-memory: { roleName: Set(permKey) }
let cache = null;
let cacheAt = 0;
const TTL = 60 * 1000; // 60 detik

async function loadMatrix() {
  const { rows } = await pool.query(
    `SELECT r.name AS role, p.key AS perm
     FROM role_permissions rp
     JOIN roles r       ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id`
  );

  const map = {};
  for (const { role, perm } of rows) {
    if (!map[role]) map[role] = new Set();
    map[role].add(perm);
  }

  cache = map;
  cacheAt = Date.now();
}

async function getPermissions(role) {
  if (!cache || Date.now() - cacheAt > TTL) {
    await loadMatrix();
  }
  return cache[role] || new Set();
}

function requirePermission(permKey) {
  return async (req, res, next) => {
    try {
      const role = req.user?.role;

      if (!role) {
        return res.status(401).json({
          success: false,
          error: "Tidak terautentikasi",
        });
      }

      const perms = await getPermissions(role);

      if (!perms.has(permKey)) {
        return res.status(403).json({
          success: false,
          error: "Akses ditolak",
          required: permKey,
        });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

// Reset cache (panggil setelah role.manage mengubah role_permissions)
requirePermission.invalidateCache = () => {
  cache = null;
};

// Helper untuk endpoint /auth (kembalikan array permission untuk frontend)
requirePermission.getPermissionList = async (role) => {
  const perms = await getPermissions(role);
  return [...perms];
};

module.exports = requirePermission;
