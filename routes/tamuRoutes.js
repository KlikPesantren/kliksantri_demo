const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertRecordInTenant } = require("../services/tenantScope");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM tamu
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
    const {
      nama_tamu,
      no_hp,
      alamat,
      instansi,
      tujuan,
      bertemu_dengan,
      keperluan,
      jumlah_orang,
      petugas,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO tamu (
        tanggal, jam_masuk, nama_tamu, no_hp, alamat, instansi,
        tujuan, bertemu_dengan, keperluan, jumlah_orang, petugas, tenant_id
      )
      VALUES (
        CURRENT_DATE, CURRENT_TIME,
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING *
      `,
      [
        nama_tamu,
        no_hp,
        alamat,
        instansi,
        tujuan,
        bertemu_dengan,
        keperluan,
        Number(jumlah_orang),
        petugas,
        req.tenantId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log("ERROR TAMU", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const owned = await assertRecordInTenant("tamu", req.tenantId, id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const {
      nama_tamu,
      no_hp,
      alamat,
      instansi,
      tujuan,
      bertemu_dengan,
      keperluan,
      jumlah_orang,
      petugas,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE tamu
      SET nama_tamu = $1, no_hp = $2, alamat = $3, instansi = $4,
          tujuan = $5, bertemu_dengan = $6, keperluan = $7,
          jumlah_orang = $8, petugas = $9
      WHERE id = $10 AND tenant_id = $11
      RETURNING *
      `,
      [
        nama_tamu,
        no_hp,
        alamat,
        instansi,
        tujuan,
        bertemu_dengan,
        keperluan,
        jumlah_orang,
        petugas,
        id,
        req.tenantId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/:id/keluar", async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE tamu
      SET status = 'Keluar', jam_keluar = CURRENT_TIME
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
      `,
      [req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tamu tidak ditemukan di tenant ini",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM tamu WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tamu tidak ditemukan di tenant ini",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
