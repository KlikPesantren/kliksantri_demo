const pool = require("../db");

exports.getMonitor = async (req, res) => {

  try {

    // =====================
    // AUTO OFFLINE DETECTION
    // =====================

    await pool.query(`
      UPDATE devices
      SET status = 'offline'
      WHERE
        last_ping IS NOT NULL
        AND last_ping < NOW() - INTERVAL '60 seconds'
    `);

    await pool.query(`
      UPDATE devices
      SET status = 'online'
      WHERE
        last_ping IS NOT NULL
        AND last_ping >= NOW() - INTERVAL '60 seconds'
    `);

    const result = await pool.query(`
      SELECT

        d.id,
        d.device_id,
        d.nama_device,
        d.status,
        d.last_ping,
        d.last_sync,

        m.nama_merchant,

        COUNT(tr.id) AS total_transaksi_hari_ini

      FROM devices d

      LEFT JOIN merchant_rfid m
      ON d.merchant_id = m.id

      LEFT JOIN transaksi_rfid tr
      ON tr.device_id = d.id
      AND DATE(tr.created_at)=CURRENT_DATE

      GROUP BY
        d.id,
        m.nama_merchant

      ORDER BY d.device_id
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

};