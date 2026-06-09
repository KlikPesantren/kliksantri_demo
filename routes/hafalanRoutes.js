const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

// ======================
// GET HAFALAN
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
        "SELECT * FROM hafalan";

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
// CREATE / UPDATE HAFALAN
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {

        santri_id,

        tanggal,

        kitab,

        awal,

        akhir,

        catatan,

        bulan,

        tahun,

        pekan

      } = req.body;

      // ======================
      // CEK DATA SUDAH ADA?
      // ======================

      const cek =

        await pool.query(

          `

          SELECT id

          FROM hafalan

          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
            AND pekan = $4

          `,

          [

            santri_id,

            bulan,

            tahun,

            pekan

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

            UPDATE hafalan

            SET

              tanggal = $1,

              kitab = $2,

              awal = $3,

              akhir = $4,

              catatan = $5

            WHERE id = $6

            RETURNING *

            `,

            [

              tanggal,

              kitab,

              awal,

              akhir,

              catatan,

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

          INSERT INTO hafalan (

            santri_id,

            tanggal,

            kitab,

            awal,

            akhir,

            catatan,

            bulan,

            tahun,

            pekan

          )

          VALUES (

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

            santri_id,

            tanggal,

            kitab,

            awal,

            akhir,

            catatan,

            bulan,

            tahun,

            pekan

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