const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

// GET

router.get(

  "/",

  async (req,res)=>{

    const result =

      await pool.query(

        `

        SELECT *

        FROM buku_kas

        ORDER BY tanggal DESC

        `

      );

    res.json({

      success:true,

      data:
      result.rows

    });

  }

);

// POST

router.post(

  "/",

  async (req,res)=>{

    const {

      tanggal,
      jenis,
      kategori,
      keterangan,
      nominal,
      petugas

    } = req.body;

    const result =

      await pool.query(

        `

        INSERT INTO buku_kas(

          tanggal,
          jenis,
          kategori,
          keterangan,
          nominal,
          petugas

        )

        VALUES(

          $1,$2,$3,$4,$5,$6

        )

        RETURNING *

        `,

        [
  tanggal || new Date().toISOString().split("T")[0],
  jenis,
  kategori,
  keterangan,
  nominal,
  petugas
]

      );

    res.json({

      success:true,

      data:
      result.rows[0]

    });

  }

);

router.put(

  "/:id",

  async (req,res) => {

    try {

      const {

        tanggal,
        jenis,
        kategori,
        keterangan,
        nominal,
        petugas

      } = req.body;

      const result =

        await pool.query(

          `

          UPDATE buku_kas

          SET

            tanggal = $1,

            jenis = $2,

            kategori = $3,

            keterangan = $4,

            nominal = $5,

            petugas = $6

          WHERE id = $7

          RETURNING *

          `,

          [

            tanggal,

            jenis,

            kategori,

            keterangan,

            nominal,

            petugas,

            req.params.id

          ]

        );

      res.json({

        success:true,

        data:
          result.rows[0]

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false

      });

    }

  }

);

router.delete(

  "/:id",

  async (req,res) => {

    try {

      await pool.query(

        `

        DELETE FROM buku_kas

        WHERE id = $1

        `,

        [

          req.params.id

        ]

      );

      res.json({

        success:true

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false

      });

    }

  }

);

module.exports =
router;