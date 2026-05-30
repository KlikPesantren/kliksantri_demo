console.log(
  "AUDIT ROUTES LOADED"
);

const express =
  require("express");

const router =
  express.Router();

const pool =
  require("../db");

// =====================
// GET AUDIT
// =====================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `
          SELECT *

          FROM audit_logs

          ORDER BY id DESC

          LIMIT 100
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
  }
);

// =====================
// POST AUDIT
// =====================

router.post(

  "/",

  async (req, res) => {

    try {

      console.log(

        "AUDIT BODY:",

        req.body

      );

      const {

        device_id,
        event_type,
        detail

      } = req.body;

      await pool.query(

        `
        INSERT INTO audit_logs
        (

          device_id,
          event_type,
          detail

        )

        VALUES

        (

          $1,
          $2,
          $3

        )
        `,

        [

          device_id,
          event_type,
          detail

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

        error: err.message

      });

    }
  }
);

module.exports =
  router;