const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

router.get(

  "/",

  async (req,res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT

            s.id,

            s.nama,

            ss.nominal_uang,

            ss.nominal_beras,

            ss.keterangan

          FROM santri s

          LEFT JOIN
          sahriyah_setting ss

          ON s.id = ss.santri_id

          ORDER BY s.nama

          `

        );

      console.log(result.rows);

      res.json({

        success:true,

        data:
        result.rows

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

router.put(

  "/:id",

  async (req,res) => {

    try {

      const {

        nominal_uang,

        nominal_beras,

        keterangan

      } = req.body;

      const cek =

        await pool.query(

          `

          SELECT *

          FROM sahriyah_setting

          WHERE santri_id = $1

          `,

          [

            req.params.id

          ]

        );

      if (

        cek.rows.length === 0

      ) {

        await pool.query(

          `

          INSERT INTO

          sahriyah_setting(

            santri_id,

            nominal_uang,

            nominal_beras,

            keterangan

          )

          VALUES(

            $1,$2,$3,$4

          )

          `,

          [

            req.params.id,

            nominal_uang,

            nominal_beras,

            keterangan

          ]

        );

      }

      else {

        await pool.query(

          `

          UPDATE

          sahriyah_setting

          SET

            nominal_uang = $1,

            nominal_beras = $2,

            keterangan = $3

          WHERE santri_id = $4

          `,

          [

            nominal_uang,

            nominal_beras,

            keterangan,

            req.params.id

          ]

        );

      }

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