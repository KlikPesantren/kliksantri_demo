const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertSantriInTenant } = require("../services/tenantScope");
const { getScopedKelasIds, assertSantriInScopedUnit } = require("../middleware/dataUnitScope");

router.get("/", async (req, res) => {
  try {
    const bulan = req.query.bulan ? Number(req.query.bulan) : null;
    const tahun = req.query.tahun ? Number(req.query.tahun) : null;

    let query = `SELECT h.* FROM hafalan h
                 INNER JOIN santri s ON s.id = h.santri_id AND s.tenant_id = h.tenant_id
                 WHERE h.tenant_id = $1`;
    const params = [req.tenantId];
    let paramIdx = 2;
    const scopedKelasIds = await getScopedKelasIds(req);
    if (scopedKelasIds) {
      query += ` AND s.kelas_id = ANY($${paramIdx}::int[])`;
      params.push(scopedKelasIds);
      paramIdx += 1;
    }

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

    query += " ORDER BY h.id DESC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      santri_id,
      tanggal,
      kitab,
      awal,
      akhir,
      catatan,
      bulan,
      tahun,
      pekan,
    } = req.body;

    const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }
    const scopeCheck = await assertSantriInScopedUnit(req, santri_id);
    if (!scopeCheck.ok) return res.status(403).json({ success: false, error: scopeCheck.error });

    const cek = await pool.query(
      `SELECT id
       FROM hafalan
       WHERE tenant_id = $1
         AND santri_id = $2
         AND bulan = $3
         AND tahun = $4
         AND pekan = $5`,
      [req.tenantId, santri_id, bulan, tahun, pekan]
    );

    if (cek.rows.length > 0) {
      const result = await pool.query(
        `UPDATE hafalan
         SET tanggal = $1, kitab = $2, awal = $3, akhir = $4, catatan = $5
         WHERE id = $6 AND tenant_id = $7
         RETURNING *`,
        [tanggal, kitab, awal, akhir, catatan, cek.rows[0].id, req.tenantId]
      );

      return res.json({
        success: true,
        mode: "update",
        data: result.rows[0],
      });
    }

    const result = await pool.query(
      `INSERT INTO hafalan (
         santri_id, tanggal, kitab, awal, akhir, catatan,
         bulan, tahun, pekan, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        santri_id,
        tanggal,
        kitab,
        awal,
        akhir,
        catatan,
        bulan,
        tahun,
        pekan,
        req.tenantId,
      ]
    );

    res.json({ success: true, mode: "insert", data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
