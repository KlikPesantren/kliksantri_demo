const express          = require("express");
const router           = express.Router();
const pool             = require("../db");
const authMiddleware   = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/requirePermission");

// Semua endpoint di sini butuh permission role.manage
router.use(authMiddleware, requirePermission("role.manage"));

// ======================
// GET /roles
// Daftar role + jumlah permission
// ======================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.name, r.label, r.is_system,
              COUNT(rp.permission_id) AS total_permission
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       GROUP BY r.id
       ORDER BY r.id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// GET /roles/permissions
// Katalog semua permission (untuk membangun matrix UI)
// ======================

router.get("/permissions", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, key, label, grup FROM permissions ORDER BY grup, key`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// GET /roles/:id
// Detail role + daftar permission key yang dimiliki
// ======================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const role = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
    if (role.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Role tidak ditemukan" });
    }

    const perms = await pool.query(
      `SELECT p.key
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...role.rows[0],
        permissions: perms.rows.map((r) => r.key),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// POST /roles
// Buat role baru (scalable — role baru tanpa ubah kode)
// ======================

router.post("/", async (req, res) => {
  try {
    const { name, label } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Nama role wajib diisi" });
    }

    const result = await pool.query(
      `INSERT INTO roles (name, label, is_system)
       VALUES ($1, $2, false)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [name.trim().toLowerCase(), label || name]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Role sudah ada" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// PUT /roles/:id/permissions
// Set ulang permission untuk role (body: { permissions: ["santri.view", ...] })
// ======================

router.put("/:id/permissions", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { permissions = [] } = req.body;

    const role = await client.query("SELECT id FROM roles WHERE id = $1", [id]);
    if (role.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Role tidak ditemukan" });
    }

    await client.query("BEGIN");

    // Reset semua permission role ini
    await client.query("DELETE FROM role_permissions WHERE role_id = $1", [id]);

    // Pasang ulang sesuai daftar key yang dikirim
    if (permissions.length > 0) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT $1, p.id FROM permissions p
         WHERE p.key = ANY($2::text[])
         ON CONFLICT DO NOTHING`,
        [id, permissions]
      );
    }

    await client.query("COMMIT");

    // Invalidasi cache permission agar perubahan langsung berlaku
    requirePermission.invalidateCache();

    res.json({ success: true, message: "Permission role diperbarui" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ======================
// DELETE /roles/:id
// Tidak boleh hapus role sistem
// ======================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const role = await pool.query("SELECT is_system FROM roles WHERE id = $1", [id]);
    if (role.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Role tidak ditemukan" });
    }
    if (role.rows[0].is_system) {
      return res.status(400).json({ success: false, error: "Role sistem tidak dapat dihapus" });
    }

    await pool.query("DELETE FROM roles WHERE id = $1", [id]);
    requirePermission.invalidateCache();

    res.json({ success: true, message: "Role dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
