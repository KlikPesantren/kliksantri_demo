const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertSantriInTenant } = require("../services/tenantScope");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.nama, ss.nominal_uang, ss.nominal_beras, ss.keterangan
       FROM santri s
       LEFT JOIN sahriyah_setting ss
         ON s.id = ss.santri_id
        AND ss.tenant_id = s.tenant_id
       WHERE s.tenant_id = $1
       ORDER BY s.nama`,
      [req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/bulk", async (req, res) => {
  try {
    const { nominal_uang, nominal_beras, keterangan } = req.body;

    if (nominal_uang === undefined || nominal_beras === undefined) {
      return res.status(400).json({
        success: false,
        error: "nominal_uang dan nominal_beras wajib diisi",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO sahriyah_setting (
        santri_id,
        nominal_uang,
        nominal_beras,
        keterangan,
        tenant_id
      )
      SELECT
        s.id,
        $1,
        $2,
        $3,
        $4
      FROM santri s
      WHERE s.tenant_id = $4
      ON CONFLICT (tenant_id, santri_id)
      DO UPDATE SET
        nominal_uang = EXCLUDED.nominal_uang,
        nominal_beras = EXCLUDED.nominal_beras,
        keterangan = EXCLUDED.keterangan
      RETURNING id
      `,
      [
        Number(nominal_uang || 0),
        Number(nominal_beras || 0),
        keterangan || "",
        req.tenantId,
      ]
    );

    res.json({
      success: true,
      updated_count: result.rowCount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { nominal_uang, nominal_beras, keterangan } = req.body;
    const santriId = req.params.id;

    const santriCheck = await assertSantriInTenant(req.tenantId, santriId);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }

    const cek = await pool.query(
      `SELECT id FROM sahriyah_setting
       WHERE santri_id = $1 AND tenant_id = $2`,
      [santriId, req.tenantId]
    );

    if (cek.rows.length === 0) {
      await pool.query(
        `INSERT INTO sahriyah_setting (
           santri_id, nominal_uang, nominal_beras, keterangan, tenant_id
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [santriId, nominal_uang, nominal_beras, keterangan, req.tenantId]
      );
    } else {
      await pool.query(
        `UPDATE sahriyah_setting
         SET nominal_uang = $1, nominal_beras = $2, keterangan = $3
         WHERE santri_id = $4 AND tenant_id = $5`,
        [nominal_uang, nominal_beras, keterangan, santriId, req.tenantId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
