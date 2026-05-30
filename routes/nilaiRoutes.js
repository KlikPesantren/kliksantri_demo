const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

// ======================
// GET NILAI
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT *

          FROM nilai_mingguan

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
// CREATE / UPDATE NILAI
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      console.log(req.body);

      const {

        santri_id,

        tanggal,

        mapel,

        nilai,

        bulan,

        tahun

      } = req.body;

      // ======================
      // CEK DATA SUDAH ADA?
      // ======================

      const cek =

        await pool.query(

          `

          SELECT id

          FROM nilai_mingguan

          WHERE santri_id = $1
            AND mapel = $2
            AND bulan = $3
            AND tahun = $4

          `,

          [

            santri_id,

            mapel,

            bulan,

            tahun

          ]

        );

      // ======================
      // UPDATE
      // ======================

      if (

        cek.rows.length > 0

      ) {

        const result =

          await pool.query(

            `

            UPDATE nilai_mingguan

            SET

              nilai = $1,

              tanggal = $2

            WHERE id = $3

            RETURNING *

            `,

            [

              nilai,

              tanggal,

              cek.rows[0].id

            ]

          );

        return res.json({

          success: true,

          mode: "update",

          data: result.rows[0]

        });

      }

      // ======================
      // INSERT
      // ======================

      const result =

        await pool.query(

          `

          INSERT INTO nilai_mingguan (

            santri_id,

            tanggal,

            mapel,

            nilai,

            bulan,

            tahun

          )

          VALUES (

            $1,
            $2,
            $3,
            $4,
            $5,
            $6

          )

          RETURNING *

          `,

          [

            santri_id,

            tanggal,

            mapel,

            nilai,

            bulan,

            tahun

          ]

        );

      res.json({

        success: true,

        mode: "insert",

        data: result.rows[0]

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