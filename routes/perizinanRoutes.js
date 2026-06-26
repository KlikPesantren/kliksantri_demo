const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  assertSantriInTenant,
  assertRecordInTenant,
} = require("../services/tenantScope");

const notificationService =
  require("../services/notificationService");

console.log("PERIZINAN ROUTES LOADED");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT perizinan.*, santri.nama
       FROM perizinan
       LEFT JOIN santri
         ON perizinan.santri_id = santri.id
        AND santri.tenant_id = perizinan.tenant_id
       WHERE perizinan.tenant_id = $1
       ORDER BY perizinan.id DESC`,
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
      alasan,
      tujuan,
      tanggal_kembali,
      jam_keluar,
      status,
      catatan,
    } = req.body;

    const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }

    const result = await pool.query(
      `INSERT INTO perizinan (
         santri_id, tanggal, alasan, tujuan, tanggal_kembali,
         jam_keluar, status, catatan, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        santri_id,
        tanggal,
        alasan,
        tujuan,
        tanggal_kembali,
        jam_keluar,
        status,
        catatan,
        req.tenantId,
      ]
    );

    const perizinanRow = result.rows[0];
    const perizinanStatus = String(
      perizinanRow.status || status || ""
    ).toLowerCase();

    if (perizinanStatus === "keluar") {
      try {
        await notificationService.sendInAppToWaliBySantriId({
          tenantId: req.tenantId,
          santriId: perizinanRow.santri_id,
          title: "Izin Keluar",
          type: "perizinan",
          data: {
            type: "perizinan",
            santri_id: Number(perizinanRow.santri_id),
            ref_table: "perizinan",
            ref_id: Number(perizinanRow.id),
          },
        });
      } catch (notifErr) {
        console.log("PERIZINAN IN-APP NOTIFICATION ERROR:", notifErr.message);
      }
    }

    res.json({ success: true, data: perizinanRow });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/kembali/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const owned = await assertRecordInTenant("perizinan", req.tenantId, id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const result = await pool.query(
      `UPDATE perizinan
       SET status = 'kembali', jam_kembali = CURRENT_TIME
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, req.tenantId]
    );

    const perizinanRow = result.rows[0];

    try {
      await notificationService.sendInAppToWaliBySantriId({
        tenantId: req.tenantId,
        santriId: perizinanRow.santri_id,
        title: "Santri Kembali",
        body: "Status perizinan santri sudah tercatat kembali.",
        type: "perizinan",
        data: {
          type: "perizinan",
          santri_id: Number(perizinanRow.santri_id),
          ref_table: "perizinan",
          ref_id: Number(perizinanRow.id),
        },
      });
    } catch (notifErr) {
      console.log("PERIZINAN STATUS IN-APP NOTIFICATION ERROR:", notifErr.message);
    }

    res.json({ success: true, data: perizinanRow });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const owned = await assertRecordInTenant("perizinan", req.tenantId, id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const existing = await pool.query(
      `SELECT id, santri_id, status
       FROM perizinan
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [id, req.tenantId]
    );

    const {
      tanggal,
      alasan,
      tujuan,
      tanggal_kembali,
      jam_keluar,
      status,
      catatan,
    } = req.body;

    const result = await pool.query(
      `UPDATE perizinan
       SET tanggal = $1, alasan = $2, tujuan = $3, tanggal_kembali = $4,
           jam_keluar = $5, status = $6, catatan = $7
       WHERE id = $8 AND tenant_id = $9
       RETURNING *`,
      [
        tanggal,
        alasan,
        tujuan,
        tanggal_kembali,
        jam_keluar,
        status,
        catatan,
        id,
        req.tenantId,
      ]
    );

    const perizinanRow = result.rows[0];
    const oldStatus = String(existing.rows[0]?.status || "").toLowerCase();
    const newStatus = String(perizinanRow.status || "").toLowerCase();

    if (newStatus && oldStatus !== newStatus) {
      try {
        await notificationService.sendInAppToWaliBySantriId({
          tenantId: req.tenantId,
          santriId: perizinanRow.santri_id,
          title: "Status Perizinan Berubah",
          body: `Status perizinan santri berubah menjadi ${perizinanRow.status}.`,
          type: "perizinan",
          data: {
            type: "perizinan",
            santri_id: Number(perizinanRow.santri_id),
            ref_table: "perizinan",
            ref_id: Number(perizinanRow.id),
          },
        });
      } catch (notifErr) {
        console.log("PERIZINAN UPDATE IN-APP NOTIFICATION ERROR:", notifErr.message);
      }
    }

    res.json({ success: true, data: perizinanRow });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM perizinan
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Perizinan tidak ditemukan di tenant ini",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
