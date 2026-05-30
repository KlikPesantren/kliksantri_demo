const pool =
  require("../db");

exports.devicePing =
  async (req, res) => {

    try {

      const {

        device_id

      } = req.body;

      const ip =
        req.ip;

      await pool.query(

        `UPDATE devices SET

          last_ping = NOW(),

          ip_address = $1

        WHERE device_id = $2`,

        [

          ip,
          device_id

        ]

      );

      res.json({

        success: true,

        message:
          "Ping diterima"

      });

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false

      });

    }

};

exports.getDevices =
  async (req, res) => {

    try {

      const result =
        await pool.query(

          "SELECT * FROM devices ORDER BY id ASC"

        );

      res.json(
        result.rows
      );

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false

      });

    }

};
