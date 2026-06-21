const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  const result = await pool.query(
    `SELECT *
     FROM buku_kas
     WHERE tenant_id = $1
     ORDER BY tanggal DESC`,
    [req.tenantId]
  );

  res.json({ success: true, data: result.rows });
});

router.post("/", async (req, res) => {
  const { tanggal, jenis, kategori, keterangan, nominal, petugas } = req.body;

  const result = await pool.query(
    `INSERT INTO buku_kas (
       tanggal, jenis, kategori, keterangan, nominal, petugas, tenant_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      tanggal || new Date().toISOString().split("T")[0],
      jenis,
      kategori,
      keterangan,
      nominal,
      petugas,
      req.tenantId,
    ]
  );

  res.json({ success: true, data: result.rows[0] });
});

router.put("/:id", async (req, res) => {
  try {
    const { tanggal, jenis, kategori, keterangan, nominal, petugas } = req.body;

    const result = await pool.query(
      `UPDATE buku_kas
       SET tanggal = $1,
           jenis = $2,
           kategori = $3,
           keterangan = $4,
           nominal = $5,
           petugas = $6
       WHERE id = $7 AND tenant_id = $8
       RETURNING *`,
      [tanggal, jenis, kategori, keterangan, nominal, petugas, req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Transaksi tidak ditemukan" });
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
      `DELETE FROM buku_kas
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Transaksi tidak ditemukan" });
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
