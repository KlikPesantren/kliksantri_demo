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

      const bulan =
        req.query.bulan
          ? Number(req.query.bulan)
          : null;

      const tahun =
        req.query.tahun
          ? Number(req.query.tahun)
          : null;

      let query =
        "SELECT * FROM nilai_mingguan";

      const params = [];

      if (bulan && tahun) {

        query +=
          " WHERE bulan = $1 AND tahun = $2";

        params.push(bulan, tahun);

      } else if (bulan) {

        query += " WHERE bulan = $1";

        params.push(bulan);

      } else if (tahun) {

        query += " WHERE tahun = $1";

        params.push(tahun);

      }

      query += " ORDER BY id DESC";

      const result =
        await pool.query(query, params);

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