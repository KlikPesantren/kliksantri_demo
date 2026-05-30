const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

// ======================
// GET GURU
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT *

          FROM guru

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

    }

  }

);

// ======================
// TAMBAH GURU
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {

        nama,
        jabatan

      } = req.body;

      const result =

        await pool.query(

          `

          INSERT INTO guru (

            nama,
            jabatan

          )

          VALUES ($1,$2)

          RETURNING *

          `,

          [

            nama,
            jabatan

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

    }

  }

);

module.exports =
router;