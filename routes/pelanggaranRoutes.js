const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

console.log(
  "PELANGGARAN ROUTES LOADED"
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

          SELECT

            pelanggaran.*,

            santri.nama

          FROM pelanggaran

          LEFT JOIN santri

          ON pelanggaran.santri_id =
          santri.id

          ORDER BY pelanggaran.id DESC

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

  santri_id,
  tanggal,
  jam,
  jenis,
  tingkat,
  poin,
  catatan,
  tindakan,
  petugas

} = req.body;

      const result =

        await pool.query(

          `

          INSERT INTO pelanggaran (

  santri_id,
  tanggal,
  jam,
  jenis,
  tingkat,
  poin,
  catatan,
  tindakan,
  petugas

)

          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)

          RETURNING *

          `,

          [
  santri_id,
  tanggal,
  jam,
  jenis,
  tingkat,
  poin,
  catatan,
  tindakan,
  petugas
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
// UPDATE
// ======================

router.put(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {

        tanggal,
        jam,
        jenis,
        tingkat,
        poin,
        catatan,
        tindakan

      } = req.body;

      const result =

        await pool.query(

          `

          UPDATE pelanggaran

          SET

            tanggal = $1,

            jam = $2,

            jenis = $3,

            tingkat = $4,

            poin = $5,

            catatan = $6,

            tindakan = $7

          WHERE id = $8

          RETURNING *

          `,

          [

            tanggal,

            jam,

            jenis,

            tingkat,

            poin,

            catatan,

            tindakan,

            id

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
// DELETE
// ======================

router.delete(

  "/:id",

  async (req, res) => {

    try {

      await pool.query(

        `

        DELETE FROM pelanggaran

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

module.exports =
router;