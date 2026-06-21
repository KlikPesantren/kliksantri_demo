const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertSantriInTenant } = require("../services/tenantScope");

router.get("/", async (req, res) => {
  try {
    const bulan = req.query.bulan ? Number(req.query.bulan) : null;
    const tahun = req.query.tahun ? Number(req.query.tahun) : null;

    let query = `SELECT id, santri_id, sesi, status,
                  TO_CHAR(tanggal::date, 'YYYY-MM-DD') AS tanggal
                 FROM absensi
                 WHERE tenant_id = $1`;
    const params = [req.tenantId];
    let paramIdx = 2;

    if (bulan && tahun) {
      query += ` AND EXTRACT(MONTH FROM tanggal::date) = $${paramIdx}`
             + ` AND EXTRACT(YEAR FROM tanggal::date) = $${paramIdx + 1}`;
      params.push(bulan, tahun);
      paramIdx += 2;
    } else if (bulan) {
      query += ` AND EXTRACT(MONTH FROM tanggal::date) = $${paramIdx}`;
      params.push(bulan);
      paramIdx += 1;
    } else if (tahun) {
      query += ` AND EXTRACT(YEAR FROM tanggal::date) = $${paramIdx}`;
      params.push(tahun);
    }

    query += " ORDER BY tanggal ASC, id ASC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { santri_id, tanggal, sesi, status } = req.body;

    if (!status || status === "") {
      return res.status(400).json({
        success: false,
        error: "Status absensi wajib diisi",
      });
    }

    const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }

    const result = await pool.query(
      `INSERT INTO absensi (santri_id, tanggal, sesi, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (santri_id, tanggal, sesi)
       DO UPDATE SET status = EXCLUDED.status, tenant_id = EXCLUDED.tenant_id
       RETURNING *`,
      [santri_id, tanggal, sesi, status, req.tenantId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
