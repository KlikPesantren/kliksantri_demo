const express =
require("express");

const pool =
require("../db");

const authMiddleware =
require("../middleware/authMiddleware");

const requirePermission =
require("../middleware/requirePermission");

const router =
express.Router();

// ======================
// GET ALL SANTRI
// ======================

router.get(

  "/",

  authMiddleware,

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT

            santri.*,

            kelas.nama_kelas,

            wali_santri.nama
            AS nama_wali,

            wali_santri.nomor_hp

          FROM santri

          LEFT JOIN kelas

          ON santri.kelas_id =
          kelas.id

          LEFT JOIN wali_santri

          ON santri.id =
          wali_santri.santri_id

          ORDER BY santri.id DESC

          `

        );

      res.json({

        success: true,

        data:
          result.rows

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

  }

);

// ======================
// TAMBAH SANTRI
// ======================

router.post(

  "/",

  authMiddleware,
  requirePermission("santri.create"),

  async (req, res) => {

    try {

      const {

        nis,
        nama,
        uid_rfid,
        alamat,
        orang_tua,
        nomor_hp_ortu,
        kelas_id,
        foto

      } = req.body;

      const result =

        await pool.query(

          `

          INSERT INTO santri (

            nis,
            nama,
            uid_rfid,
            alamat,
            orang_tua,
            nomor_hp_ortu,
            kelas_id,
            foto

          )

          VALUES (

            $1,$2,$3,$4,$5,$6,$7,$8

          )

          RETURNING *

          `,

          [

            nis,
            nama,
            uid_rfid,
            alamat,
            orang_tua,
            nomor_hp_ortu,
            kelas_id,
            foto

          ]

        );

      res.json({

        success: true,

        data:
          result.rows[0]

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

  }

);

// ======================
// UPDATE SANTRI
// ======================

router.put(

  "/:id",

  authMiddleware,
  requirePermission("santri.update"),

  async (req, res) => {

    try {

      const {

        id

      } = req.params;

      const {

        nis,
        nama,
        uid_rfid,
        alamat,
        orang_tua,
        nomor_hp_ortu,
        kelas_id,
        foto

      } = req.body;

      const result =

        await pool.query(

          `

          UPDATE santri

          SET

            nis = $1,
            nama = $2,
            uid_rfid = $3,
            alamat = $4,
            orang_tua = $5,
            nomor_hp_ortu = $6,
            kelas_id = $7,
            foto = $8

          WHERE id = $9

          RETURNING *

          `,

          [

            nis,
            nama,
            uid_rfid,
            alamat,
            orang_tua,
            nomor_hp_ortu,
            kelas_id,
            foto,
            id

          ]

        );

      res.json({

        success: true,

        data:
          result.rows[0]

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

  }

);

// ======================
// DELETE SANTRI
// ======================

router.delete(

  "/:id",

  authMiddleware,
  requirePermission("santri.delete"),

  async (req, res) => {

    try {

      await pool.query(

        `

        DELETE FROM santri

        WHERE id = $1

        `,

        [

          req.params.id

        ]

      );

      res.json({

        success: true

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

  }

);

// ======================
// RFID LOOKUP
// ======================

router.get(
  "/rfid/:uid",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            nama,
            uid_rfid,
            saldo,
            limit_harian
          FROM santri
          WHERE uid_rfid=$1
          `,
          [req.params.uid]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          success: false
        });

      }

      res.json(
        result.rows[0]
      );

    }

    catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        error: err.message
      });

    }

  }
);

module.exports =
router;