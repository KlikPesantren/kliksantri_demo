const express = require("express");

const pool = require("../db");

const router = express.Router();

// ======================
// GET ALL KELAS
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `
          SELECT *

          FROM kelas

          ORDER BY id ASC
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
// TAMBAH KELAS
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {

        nama_kelas

      } = req.body;

      const result =

        await pool.query(

          `
          INSERT INTO kelas
          (

            nama_kelas

          )

          VALUES

          (

            $1

          )

          RETURNING *
          `,

          [

            nama_kelas

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
// DELETE KELAS
// ======================

router.delete(

  "/:id",

  async (req, res) => {

    try {

      await pool.query(

        `
        DELETE FROM kelas

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

module.exports = router;