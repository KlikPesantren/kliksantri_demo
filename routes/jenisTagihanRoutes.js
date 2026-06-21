const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM jenis_tagihan
       WHERE tenant_id = $1
       ORDER BY id DESC`,
      [req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nama_tagihan, is_bulanan } = req.body;

    const result = await pool.query(
      `INSERT INTO jenis_tagihan (nama_tagihan, is_bulanan, tenant_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nama_tagihan, is_bulanan, req.tenantId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

console.log("JENIS TAGIHAN ROUTES LOADED");

module.exports = router;
