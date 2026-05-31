const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

console.log(
  "PEMBAYARAN ROUTES LOADED"
);

// ======================
// GET ALL PEMBAYARAN
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

         SELECT

  pembayaran.*,

  santri.nama

          FROM pembayaran

          ORDER BY pembayaran.id DESC

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
// CREATE PEMBAYARAN
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {

        santri_id,
        nama_tagihan,
        bulan,
        tahun,
        nominal_tagihan,
        nominal_bayar

      } = req.body;

      const sisa_tunggakan =

        nominal_tagihan -
        nominal_bayar;

      let status = "belum";

      if (

        sisa_tunggakan <= 0

      ) {

        status = "lunas";

      }

      else if (

        nominal_bayar > 0

      ) {

        status = "cicil";

      }

      const result =

        await pool.query(

          `

          INSERT INTO pembayaran (

  santri_id,
  nama_tagihan,
  bulan,
  tahun,
  nominal_tagihan,
  nominal_bayar,
  sisa_tunggakan,
  status

)

          VALUES (

            $1,$2,$3,$4,$5,$6,$7,$8

          )

          RETURNING *

          `,

          [

  santri_id,
  nama_tagihan,
  bulan,
  tahun,
  nominal_tagihan,
  nominal_bayar,
  sisa_tunggakan,
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