const express =
require("express");

const router =
express.Router();

const pool =
require("../db");


// ======================
// GET ALL TAGIHAN
// ======================

router.get(

  "/",

  async (req,res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT

            t.*,

            s.nama

          FROM tagihan_sahriyah t

          LEFT JOIN santri s

          ON t.santri_id = s.id

          ORDER BY

          t.tahun DESC,

          t.bulan DESC

          `

        );

      res.json({

        success:true,

        data:
        result.rows

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error:
        err.message

      });

    }

  }

);


// ======================
// GENERATE TAGIHAN
// ======================

router.post(

  "/generate",

  async (req,res) => {

    try {

      const {

        bulan,

        tahun

      } = req.body;

      const santri =

        await pool.query(

          `

          SELECT

            s.id,

            ss.nominal_uang,

            ss.nominal_beras,

            ss.keterangan

          FROM santri s

          LEFT JOIN

          sahriyah_setting ss

          ON s.id = ss.santri_id

          ORDER BY s.id

          `

        );

      for (

        const s

        of

        santri.rows

      ) {
        console.log(
  "DATA SANTRI:",
  s
);

        const cek =

          await pool.query(

            `

            SELECT id

            FROM tagihan_sahriyah

            WHERE

            santri_id = $1

            AND bulan = $2

            AND tahun = $3

            `,

            [

              s.id,

              bulan,

              tahun

            ]

          );

        if (

          cek.rows.length === 0

        ) {

          await pool.query(

            `

            INSERT INTO

            tagihan_sahriyah(

              santri_id,

              bulan,

              tahun,

              nominal,

              nominal_beras,

              keterangan

            )

            VALUES(

              $1,$2,$3,$4,$5,$6

            )

            `,

            [

              s.id,

              bulan,

              tahun,

              s.nominal_uang || 0,

              s.nominal_beras || 0,

              s.keterangan || ""

            ]

          );

        }

      }

      res.json({

        success:true,

        message:
        "Tagihan berhasil dibuat"

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error:
        err.message

      });

    }

  }

);


// ======================
// BAYAR SAHRIYAH
// ======================

router.put(

  "/bayar/:id",

  async (req,res) => {

    try {

      const {

        petugas

      } = req.body;

      const tagihan =

        await pool.query(

          `

          SELECT *

          FROM tagihan_sahriyah

          WHERE id = $1

          `,

          [

            req.params.id

          ]

        );

      if (

        tagihan.rows.length === 0

      ) {

        return res.status(404)

        .json({

          success:false

        });

      }

      const data =

        tagihan.rows[0];

      await pool.query(

        `

        UPDATE

        tagihan_sahriyah

        SET

          status =
          'Lunas',

          tanggal_bayar =
          CURRENT_DATE,

          petugas = $1

        WHERE id = $2

        `,

        [

          petugas,

          req.params.id

        ]

      );

      // ===================
      // MASUK BUKU KAS
      // ===================

      await pool.query(

        `

        INSERT INTO

        buku_kas(

          tanggal,

          jenis,

          kategori,

          keterangan,

          nominal,

          petugas

        )

        VALUES(

          CURRENT_DATE,

          'Masuk',

          'Sahriyah',

          'Pembayaran Sahriyah',

          $1,

          $2

        )

        `,

        [

          data.nominal,

          petugas

        ]

      );

      res.json({

        success:true

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error:
        err.message

      });

    }

  }

);

module.exports =
router;