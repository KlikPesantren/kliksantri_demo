const express = require("express");
const router = express.Router();
const pool = require("../db");

// ======================
// GET ALL
// ======================

router.get("/", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT *
      FROM tamu
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});

// ======================
// CREATE
// ======================

router.post("/", async (req, res) => {

  try {

    console.log("BODY TAMU:");
    console.log(req.body);

    const {
      nama_tamu,
      no_hp,
      alamat,
      instansi,
      tujuan,
      bertemu_dengan,
      keperluan,
      jumlah_orang,
      petugas
    } = req.body;

 const result = await pool.query(

`
INSERT INTO tamu
(
  tanggal,
  jam_masuk,
  nama_tamu,
  no_hp,
  alamat,
  instansi,
  tujuan,
  bertemu_dengan,
  keperluan,
  jumlah_orang,
  petugas
)

VALUES
(
  CURRENT_DATE,
  CURRENT_TIME,

  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9
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
  petugas
]

);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {

  console.log("ERROR TAMU");
  console.log(err);

  res.status(500).json({
    success:false,
    error: err.message
  });

}

});

// ======================
// UPDATE
// ======================

router.put("/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const {
      nama_tamu,
      no_hp,
      alamat,
      instansi,
      tujuan,
      bertemu_dengan,
      keperluan,
      jumlah_orang,
      petugas
    } = req.body;

    const result = await pool.query(
      `
      UPDATE tamu
      SET
        nama_tamu = $1,
        no_hp = $2,
        alamat = $3,
        instansi = $4,
        tujuan = $5,
        bertemu_dengan = $6,
        keperluan = $7,
        jumlah_orang = $8,
        petugas = $9
      WHERE id = $10
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
        id
      ]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

// ======================
// KELUAR
// ======================

router.patch("/:id/keluar", async (req, res) => {

  try {

    const result = await pool.query(
      `
      UPDATE tamu
      SET
        status = 'Keluar',
        jam_keluar = CURRENT_TIME
      WHERE id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

// ======================
// DELETE
// ======================

router.delete("/:id", async (req, res) => {

  try {

    await pool.query(
      `
      DELETE FROM tamu
      WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

module.exports = router;