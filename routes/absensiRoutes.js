const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

// ======================
// GET ABSENSI
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      console.log(req.body);

      const result =

        await pool.query(

          `

          SELECT *

          FROM absensi

          ORDER BY id DESC

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
// CREATE ABSENSI
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {

        santri_id,

        tanggal,

        sesi,

        status

      } = req.body;

      const result =

        await pool.query(

          `

          INSERT INTO absensi (

            santri_id,

            tanggal,

            sesi,

            status

          )

          VALUES (

            $1,
            $2,
            $3,
            $4

          )

          RETURNING *

          `,

          [

            santri_id,

            tanggal,

            sesi,

            status

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

module.exports =
router;