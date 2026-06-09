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

      const bulan =
        req.query.bulan
          ? Number(req.query.bulan)
          : null;

      const tahun =
        req.query.tahun
          ? Number(req.query.tahun)
          : null;

      let query =
        "SELECT * FROM absensi";

      const params = [];

      if (bulan && tahun) {

        query +=
          " WHERE EXTRACT(MONTH FROM tanggal::date) = $1" +
          " AND EXTRACT(YEAR FROM tanggal::date) = $2";

        params.push(bulan, tahun);

      } else if (bulan) {

        query +=
          " WHERE EXTRACT(MONTH FROM tanggal::date) = $1";

        params.push(bulan);

      } else if (tahun) {

        query +=
          " WHERE EXTRACT(YEAR FROM tanggal::date) = $1";

        params.push(tahun);

      }

      query += " ORDER BY tanggal ASC, id ASC";

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
// UPSERT ABSENSI
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

      if (!status || status === "") {

        return res.status(400).json({
          success: false,
          error: "Status absensi wajib diisi"
        });

      }

      // UPSERT: jika kombinasi santri+tanggal+sesi sudah ada, update statusnya
      const result =

        await pool.query(

          `
          INSERT INTO absensi (
            santri_id,
            tanggal,
            sesi,
            status
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (santri_id, tanggal, sesi)
          DO UPDATE SET status = EXCLUDED.status
          RETURNING *
          `,

          [santri_id, tanggal, sesi, status]

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