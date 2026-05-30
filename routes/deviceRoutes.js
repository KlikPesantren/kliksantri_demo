const express = require("express");

const router = express.Router();

const pool = require("../db");

// =====================
// DEVICE PING
// =====================

router.post(

  "/ping",

  async (req, res) => {

    try {

      const {

        device_id,
        device_secret

      } = req.body;

      if (

        device_secret
        !== "SECRET123"

      ) {

        return res.status(401).json({

          success: false

        });
      }

      await pool.query(

        `INSERT INTO devices
        (

          device_id,
          device_secret,
          nama_device,
          status,
          created_at,
          last_ping,
          ip_address

        )

        VALUES

        (

          $1,
          $2,
          $3,
          'online',
          NOW(),
          NOW(),
          $4

        )

        ON CONFLICT (device_id)

        DO UPDATE SET

          device_secret = $2,
          nama_device = $3,
          status = 'online',
          last_ping = NOW(),
          ip_address = $4
        `,

        [

          device_id,

          device_secret,

          device_id,

          req.ip

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

// =====================
// GET DEVICES
// =====================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `SELECT *

          FROM devices

          ORDER BY id DESC`

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

console.log(
  "DEVICE ROUTES READY"
);

module.exports = router;