console.log(
  "WALI ROUTES LOADED"
);

const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

// ======================
// GET ALL WALI
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT

            wali_santri.*,

            santri.nama
            AS nama_santri

          FROM wali_santri

          LEFT JOIN santri

          ON wali_santri.santri_id =
          santri.id

          ORDER BY wali_santri.id DESC

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
// CREATE WALI
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {

        nama,
        nomor_hp,
        alamat,
        santri_id

      } = req.body;

      const result =

        await pool.query(

          `

          INSERT INTO wali_santri (

            nama,
            nomor_hp,
            alamat,
            santri_id

          )

          VALUES ($1,$2,$3,$4)

          RETURNING *

          `,

          [

            nama,
            nomor_hp,
            alamat,
            santri_id

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
// UPDATE WALI
// ======================

router.put(

  "/:id",

  async (req, res) => {

    try {

      const {

        id

      } = req.params;

      const {

        nama,
        nomor_hp,
        alamat,
        santri_id

      } = req.body;

      const result =

        await pool.query(

          `

          UPDATE wali_santri

          SET

            nama = $1,
            nomor_hp = $2,
            alamat = $3,
            santri_id = $4

          WHERE id = $5

          RETURNING *

          `,

          [

            nama,
            nomor_hp,
            alamat,
            santri_id,
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
// DELETE WALI
// ======================

router.delete(

  "/:id",

  async (req, res) => {

    try {

      const {

        id

      } = req.params;

      await pool.query(

        `

        DELETE FROM wali_santri

        WHERE id = $1

        `,

        [id]

      );

      res.json({

        success: true,

        message:
          "Wali deleted"

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

module.exports =
router;