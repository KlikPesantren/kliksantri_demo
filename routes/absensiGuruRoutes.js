const express = require("express");

const router = express.Router();

const pool = require("../db");

// ======================
// GET
// ======================

router.get("/", async (req, res) => {

  try {

    const result = await pool.query(

      `

      SELECT *

      FROM absensi_guru

      ORDER BY id DESC

      `

    );

    res.json({

      success: true,

      data: result.rows

    });

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      error: err.message

    });

  }

});

// ======================
// POST
// ======================

router.post("/", async (req, res) => {

  try {

    const {

      guru_id,

      bulan,

      tahun,

      total_hadir,

      total_izin,

      total_sakit,

      total_alfa

    } = req.body;

    const result = await pool.query(

      `

      INSERT INTO absensi_guru (

        guru_id,

        bulan,

        tahun,

        total_hadir,

        total_izin,

        total_sakit,

        total_alfa

      )

      VALUES (

        $1,$2,$3,$4,$5,$6,$7

      )

      ON CONFLICT (guru_id, bulan, tahun)

      DO UPDATE SET

        total_hadir = EXCLUDED.total_hadir,

        total_izin  = EXCLUDED.total_izin,

        total_sakit = EXCLUDED.total_sakit,

        total_alfa  = EXCLUDED.total_alfa

      RETURNING *

      `,

      [

        guru_id,

        bulan,

        tahun,

        total_hadir  || 0,

        total_izin   || 0,

        total_sakit  || 0,

        total_alfa   || 0

      ]

    );

    res.json({

      success: true,

      data: result.rows[0]

    });

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      error: err.message

    });

  }

});

module.exports = router;