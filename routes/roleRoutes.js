const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const {
  isPlatformRole,
  isTenantAssignableRole,
  rejectTenantRoleMutation,
  tenantAssignableRolesSqlList,
} = require("../utils/platformRbac");

router.use(authMiddleware, tenantMiddleware, requirePermission("role.manage"));

const assignableRoles = tenantAssignableRolesSqlList();

async function getRoleById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, label, is_system FROM roles WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

function sendMutationBlocked(res) {
  const blocked = rejectTenantRoleMutation();
  return res.status(blocked.status).json({
    success: false,
    error: blocked.error,
  });
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.name, r.label, r.is_system,
              COUNT(rp.permission_id) AS total_permission
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       WHERE r.name = ANY($1::text[])
       GROUP BY r.id
       ORDER BY r.id ASC`,
      [assignableRoles],
    );
    res.json({
      success: true,
      rbac_read_only: true,
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/permissions", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, key, label, grup
       FROM permissions
       WHERE grup <> 'platform'
       ORDER BY grup, key`,
    );
    res.json({
      success: true,
      rbac_read_only: true,
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getRoleById(id);

    if (!role || isPlatformRole(role.name) || !isTenantAssignableRole(role.name)) {
      return res.status(404).json({ success: false, error: "Role tidak ditemukan" });
    }

    const perms = await pool.query(
      `SELECT p.key
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1
         AND p.grup <> 'platform'`,
      [id],
    );

    res.json({
      success: true,
      rbac_read_only: true,
      data: {
        ...role,
        permissions: perms.rows.map((r) => r.key),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", (_req, res) => sendMutationBlocked(res));

router.put("/:id/permissions", (_req, res) => sendMutationBlocked(res));

router.delete("/:id", (_req, res) => sendMutationBlocked(res));

module.exports = router;
