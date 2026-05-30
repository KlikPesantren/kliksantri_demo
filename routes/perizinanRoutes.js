const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

console.log(
  "PERIZINAN ROUTES LOADED"
);

// ======================
// GET ALL PERIZINAN
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT

            perizinan.*,

            santri.nama

          FROM perizinan

          LEFT JOIN santri

          ON perizinan.santri_id =
          santri.id

          ORDER BY perizinan.id DESC

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
// CREATE PERIZINAN
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

    const {

  santri_id,
  tanggal,
  alasan,
  tujuan,
  tanggal_kembali,
  jam_keluar,
  status,
  catatan

} = req.body;

      const result =

        await pool.query(

          `

         INSERT INTO perizinan (

  santri_id,
  tanggal,
  alasan,
  tujuan,
  tanggal_kembali,
  jam_keluar,
  status,
  catatan

)

          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)

          RETURNING *

          `,

          [

  santri_id,
  tanggal,
  alasan,
  tujuan,
  tanggal_kembali,
  jam_keluar,
  status,
  catatan

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
// UPDATE KEMBALI
// ======================

router.put(

  "/kembali/:id",

  async (req, res) => {

    try {

      const {

        id

      } = req.params;

      const result =

        await pool.query(

          `

          UPDATE perizinan

          SET

            status = 'kembali',

            jam_kembali =
            CURRENT_TIME

          WHERE id = $1

          RETURNING *

          `,

          [id]

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
// UPDATE PERIZINAN
// ======================

router.put(

  "/:id",

  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {

        tanggal,
        alasan,
        tujuan,
        tanggal_kembali,
        jam_keluar,
        status,
        catatan

      } = req.body;

      const result =

        await pool.query(

          `

          UPDATE perizinan

          SET

            tanggal = $1,

            alasan = $2,

            tujuan = $3,

            tanggal_kembali = $4,

            jam_keluar = $5,

            status = $6,

            catatan = $7

          WHERE id = $8

          RETURNING *

          `,

          [

            tanggal,

            alasan,

            tujuan,

            tanggal_kembali,

            jam_keluar,

            status,

            catatan,

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
// DELETE PERIZINAN
// ======================

router.delete(

  "/:id",

  async (req, res) => {

    try {

      await pool.query(

        `

        DELETE FROM perizinan

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