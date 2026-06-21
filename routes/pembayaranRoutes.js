const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  assertSantriInTenant,
  assertPembayaranInTenant,
} = require("../services/tenantScope");

console.log("PEMBAYARAN ROUTES LOADED");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pembayaran.*, santri.nama
       FROM pembayaran
       LEFT JOIN santri
         ON pembayaran.santri_id = santri.id
        AND santri.tenant_id = pembayaran.tenant_id
       WHERE pembayaran.tenant_id = $1
       ORDER BY pembayaran.id DESC`,
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
      nama_tagihan,
      bulan,
      tahun,
      nominal_tagihan,
      nominal_bayar,
    } = req.body;

    const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }

    const sisa_tunggakan = nominal_tagihan - nominal_bayar;

    let status = "belum";
    if (sisa_tunggakan <= 0) status = "lunas";
    else if (nominal_bayar > 0) status = "cicil";

    const result = await pool.query(
      `INSERT INTO pembayaran (
         santri_id, nama_tagihan, bulan, tahun,
         nominal_tagihan, nominal_bayar, sisa_tunggakan, status, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        santri_id,
        nama_tagihan,
        bulan,
        tahun,
        nominal_tagihan,
        nominal_bayar,
        sisa_tunggakan,
        status,
        req.tenantId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/bayar/:id", async (req, res) => {
  try {
    const { nominal, petugas } = req.body;

    const pembayaran = await pool.query(
      `SELECT pembayaran.*, santri.nama
       FROM pembayaran
       LEFT JOIN santri
         ON pembayaran.santri_id = santri.id
        AND santri.tenant_id = pembayaran.tenant_id
       WHERE pembayaran.id = $1 AND pembayaran.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    if (pembayaran.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Pembayaran tidak ditemukan" });
    }

    const data = pembayaran.rows[0];
    const totalBayarBaru = Number(data.nominal_bayar || 0) + Number(nominal);
    const sisaBaru = Number(data.nominal_tagihan) - totalBayarBaru;

    let status = "belum";
    if (totalBayarBaru > 0 && sisaBaru > 0) status = "cicil";
    if (sisaBaru <= 0) status = "lunas";

    await pool.query(
      `UPDATE pembayaran
       SET nominal_bayar = $1,
           sisa_tunggakan = $2,
           sisa_tagihan = $3,
           status = $4,
           tanggal_bayar = CASE
             WHEN $4::varchar = 'lunas' THEN CURRENT_DATE
             ELSE tanggal_bayar
           END
       WHERE id = $5 AND tenant_id = $6`,
      [
        totalBayarBaru,
        Math.max(0, sisaBaru),
        Math.max(0, sisaBaru),
        status,
        req.params.id,
        req.tenantId,
      ]
    );

    await pool.query(
      `INSERT INTO pembayaran_detail (pembayaran_id, nominal, petugas, tenant_id)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, nominal, petugas, req.tenantId]
    );

    await pool.query(
      `INSERT INTO buku_kas (
         tanggal, jenis, kategori, keterangan, nominal, petugas, tenant_id
       )
       VALUES (
         CURRENT_DATE, 'Masuk', 'Pembayaran', $1, $2, $3, $4
       )`,
      [`${data.nama_tagihan} - ${data.nama}`, nominal, petugas, req.tenantId]
    );

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM pembayaran
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Pembayaran tidak ditemukan" });
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/riwayat/:id", async (req, res) => {
  try {
    const owned = await assertPembayaranInTenant(req.tenantId, req.params.id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const result = await pool.query(
      `SELECT *
       FROM pembayaran_detail
       WHERE pembayaran_id = $1 AND tenant_id = $2
       ORDER BY id DESC`,
      [req.params.id, req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
