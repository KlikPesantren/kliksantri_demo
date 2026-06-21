const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertSantriInTenant } = require("../services/tenantScope");

router.get("/", async (req, res) => {
  try {
    const bulan = req.query.bulan ? Number(req.query.bulan) : null;
    const tahun = req.query.tahun ? Number(req.query.tahun) : null;

    let query = "SELECT * FROM nilai_mingguan WHERE tenant_id = $1";
    const params = [req.tenantId];
    let paramIdx = 2;

    if (bulan && tahun) {
      query += ` AND bulan = $${paramIdx} AND tahun = $${paramIdx + 1}`;
      params.push(bulan, tahun);
    } else if (bulan) {
      query += ` AND bulan = $${paramIdx}`;
      params.push(bulan);
    } else if (tahun) {
      query += ` AND tahun = $${paramIdx}`;
      params.push(tahun);
    }

    query += " ORDER BY id DESC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { santri_id, tanggal, mapel, nilai, bulan, tahun } = req.body;

    const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }

    const cek = await pool.query(
      `SELECT id
       FROM nilai_mingguan
       WHERE tenant_id = $1
         AND santri_id = $2
         AND mapel = $3
         AND bulan = $4
         AND tahun = $5`,
      [req.tenantId, santri_id, mapel, bulan, tahun]
    );

    if (cek.rows.length > 0) {
      const result = await pool.query(
        `UPDATE nilai_mingguan
         SET nilai = $1, tanggal = $2
         WHERE id = $3 AND tenant_id = $4
         RETURNING *`,
        [nilai, tanggal, cek.rows[0].id, req.tenantId]
      );

      return res.json({
        success: true,
        mode: "update",
        data: result.rows[0],
      });
    }

    const result = await pool.query(
      `INSERT INTO nilai_mingguan (
         santri_id, tanggal, mapel, nilai, bulan, tahun, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [santri_id, tanggal, mapel, nilai, bulan, tahun, req.tenantId]
    );

    res.json({ success: true, mode: "insert", data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
