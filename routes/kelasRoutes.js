const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");

const router = express.Router();
const withTenant = [authMiddleware, tenantMiddleware];

router.get("/", ...withTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM kelas
       WHERE tenant_id = $1
       ORDER BY id ASC`,
      [req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  "/",
  ...withTenant,
  requirePermission("kelas.manage"),
  async (req, res) => {
    try {
      const { nama_kelas } = req.body;

      const result = await pool.query(
        `INSERT INTO kelas (nama_kelas, tenant_id)
         VALUES ($1, $2)
         RETURNING *`,
        [nama_kelas, req.tenantId]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.delete(
  "/:id",
  ...withTenant,
  requirePermission("kelas.manage"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM kelas
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [req.params.id, req.tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Kelas tidak ditemukan" });
      }

      res.json({ success: true });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
