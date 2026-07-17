const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const { getScopedUnitIds } = require("../middleware/dataUnitScope");

const router = express.Router();
const withTenant = [authMiddleware, tenantMiddleware];

router.get("/", ...withTenant, async (req, res) => {
  try {
    const scopedUnitIds = await getScopedUnitIds(req);
    const scopeSql = scopedUnitIds ? " AND kelas.unit_id = ANY($2::int[])" : "";
    const result = await pool.query(
      `SELECT kelas.*, u.kode AS unit_kode, u.nama AS unit_nama
       FROM kelas
       INNER JOIN unit_pendidikan u ON u.id = kelas.unit_id AND u.tenant_id = kelas.tenant_id
       WHERE kelas.tenant_id = $1${scopeSql}
       ORDER BY id ASC`,
      scopedUnitIds ? [req.tenantId, scopedUnitIds] : [req.tenantId]
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
      const { nama_kelas, unit_id } = req.body;
      const unitValue = unit_id || (await pool.query(
        `SELECT id FROM unit_pendidikan WHERE tenant_id = $1 AND UPPER(kode) = 'PESANTREN' AND is_active = true`,
        [req.tenantId],
      )).rows[0]?.id;

      const unit = await pool.query(
        `SELECT id FROM unit_pendidikan WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
        [unitValue, req.tenantId],
      );
      if (unit.rows.length === 0) {
        return res.status(400).json({ success: false, error: "Unit pendidikan tidak valid" });
      }
      const scopedUnitIds = await getScopedUnitIds(req);
      if (scopedUnitIds && !scopedUnitIds.includes(Number(unitValue))) {
        return res.status(403).json({ success: false, error: "Unit berada di luar scope operator" });
      }

      const result = await pool.query(
        `INSERT INTO kelas (nama_kelas, tenant_id, unit_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [nama_kelas, req.tenantId, unitValue]
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
