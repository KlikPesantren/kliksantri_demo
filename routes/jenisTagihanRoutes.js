const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

console.log(
  "JENIS TAGIHAN ROUTES LOADED"
);

// ======================
// GET ALL
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT *

          FROM jenis_tagihan

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
// CREATE
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {

        nama_tagihan,
        is_bulanan

      } = req.body;

      const result =

        await pool.query(

          `

          INSERT INTO jenis_tagihan (

            nama_tagihan,
            is_bulanan

          )

          VALUES ($1,$2)

          RETURNING *

          `,

          [

            nama_tagihan,
            is_bulanan

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