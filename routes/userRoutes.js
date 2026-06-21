const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");

const withTenant = [authMiddleware, tenantMiddleware];

// ======================
// GET /users/meta/roles — daftar role untuk dropdown form
// ======================

router.get(
  "/meta/roles",
  ...withTenant,
  requirePermission("user.view"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT name, label FROM roles ORDER BY id ASC"
      );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ======================
// GET /users
// ======================

router.get(
  "/",
  ...withTenant,
  requirePermission("user.view"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.id, u.nama, u.username, u.role, u.status, u.created_at,
                u.tenant_id,
                r.label AS role_label
         FROM users u
         LEFT JOIN roles r ON r.name = u.role
         WHERE u.tenant_id = $1
         ORDER BY u.id ASC`,
        [req.tenantId]
      );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ======================
// POST /users
// ======================

router.post(
  "/",
  ...withTenant,
  requirePermission("user.create"),
  async (req, res) => {
    try {
      const { nama, username, password, role, status } = req.body;

      if (!nama || !username || !password || !role) {
        return res.status(400).json({ success: false, error: "Semua field wajib diisi" });
      }

      const exists = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND tenant_id = $2",
        [username, req.tenantId]
      );
      if (exists.rows.length > 0) {
        return res.status(400).json({ success: false, error: "Username sudah digunakan" });
      }

      const hash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, nama, username, role, status, tenant_id, created_at`,
        [nama, username, hash, role, status || "Aktif", req.tenantId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ======================
// PUT /users/:id
// ======================

router.put(
  "/:id",
  ...withTenant,
  requirePermission("user.update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nama, username, password, role, status } = req.body;

      if (!nama || !username || !role) {
        return res.status(400).json({ success: false, error: "Nama, username, dan role wajib diisi" });
      }

      let result;
      if (password && password.trim()) {
        const hash = await bcrypt.hash(password, 10);
        result = await pool.query(
          `UPDATE users
           SET nama = $1, username = $2, password = $3, role = $4, status = $5
           WHERE id = $6 AND tenant_id = $7
           RETURNING id, nama, username, role, status, tenant_id, created_at`,
          [nama, username, hash, role, status || "Aktif", id, req.tenantId]
        );
      } else {
        result = await pool.query(
          `UPDATE users
           SET nama = $1, username = $2, role = $3, status = $4
           WHERE id = $5 AND tenant_id = $6
           RETURNING id, nama, username, role, status, tenant_id, created_at`,
          [nama, username, role, status || "Aktif", id, req.tenantId]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "User tidak ditemukan" });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ======================
// PUT /users/:id/reset-password
// ======================

router.put(
  "/:id/reset-password",
  ...withTenant,
  requirePermission("user.update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 4) {
        return res.status(400).json({ success: false, error: "Password minimal 4 karakter" });
      }

      const hash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `UPDATE users SET password = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, username`,
        [hash, id, req.tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "User tidak ditemukan" });
      }

      res.json({ success: true, message: "Password berhasil direset" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ======================
// DELETE /users/:id
// ======================

router.delete(
  "/:id",
  ...withTenant,
  requirePermission("user.delete"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (String(req.user.id) === String(id)) {
        return res.status(400).json({ success: false, error: "Tidak dapat menghapus akun sendiri" });
      }

      const check = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND tenant_id = $2",
        [id, req.tenantId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, error: "User tidak ditemukan" });
      }

      await pool.query("DELETE FROM users WHERE id = $1 AND tenant_id = $2", [id, req.tenantId]);
      res.json({ success: true, message: "User berhasil dihapus" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
