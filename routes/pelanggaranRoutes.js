const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  assertSantriInTenant,
  assertRecordInTenant,
} = require("../services/tenantScope");

const notificationService =
  require("../services/notificationService");

console.log("PELANGGARAN ROUTES LOADED");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pelanggaran.*, santri.nama, santri.kamar
       FROM pelanggaran
       LEFT JOIN santri
         ON pelanggaran.santri_id = santri.id
        AND santri.tenant_id = pelanggaran.tenant_id
       WHERE pelanggaran.tenant_id = $1
       ORDER BY pelanggaran.id DESC`,
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
    const {
      santri_id,
      tanggal,
      jam,
      jenis,
      tingkat,
      poin,
      catatan,
      tindakan,
      petugas,
    } = req.body;

    const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }

    const result = await pool.query(
      `INSERT INTO pelanggaran (
         santri_id, tanggal, jam, jenis, tingkat, poin,
         catatan, tindakan, petugas, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        santri_id,
        tanggal,
        jam,
        jenis,
        tingkat,
        poin,
        catatan,
        tindakan,
        petugas,
        req.tenantId,
      ]
    );

    const pelanggaranRow = result.rows[0];

    try {
      await notificationService.sendInAppToWaliBySantriId({
        tenantId: req.tenantId,
        santriId: pelanggaranRow.santri_id,
        title: "Pelanggaran Baru",
        type: "pelanggaran",
        data: {
          type: "pelanggaran",
          santri_id: Number(pelanggaranRow.santri_id),
          ref_table: "pelanggaran",
          ref_id: Number(pelanggaranRow.id),
        },
      });
    } catch (notifErr) {
      console.log("PELANGGARAN IN-APP NOTIFICATION ERROR:", notifErr.message);
    }

    res.json({ success: true, data: pelanggaranRow });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const owned = await assertRecordInTenant("pelanggaran", req.tenantId, id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const { tanggal, jam, jenis, tingkat, poin, catatan, tindakan } = req.body;

    const result = await pool.query(
      `UPDATE pelanggaran
       SET tanggal = $1, jam = $2, jenis = $3, tingkat = $4,
           poin = $5, catatan = $6, tindakan = $7
       WHERE id = $8 AND tenant_id = $9
       RETURNING *`,
      [tanggal, jam, jenis, tingkat, poin, catatan, tindakan, id, req.tenantId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM pelanggaran
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Pelanggaran tidak ditemukan di tenant ini",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
