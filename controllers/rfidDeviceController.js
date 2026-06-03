const pool = require("../db");
const crypto = require("crypto");

// =====================
// REGISTER DEVICE
// =====================

exports.register = async (req, res) => {

  try {

    const {
      device_id,
      nama_device,
      firmware_version
    } = req.body;

    const existing =
      await pool.query(
        `
        SELECT *
        FROM devices
        WHERE device_id=$1
        `,
        [device_id]
      );

    // =====================
    // DEVICE SUDAH ADA
    // =====================

    if (
      existing.rows.length > 0
    ) {

      await pool.query(
        `
        UPDATE devices
        SET
          last_ping = NOW(),
          firmware_version = $1
        WHERE device_id = $2
        `,
        [
          firmware_version,
          device_id
        ]
      );

      return res.json({
        success: true,
        registered: false,
        device_secret:
          existing.rows[0].device_secret
      });

    }

    // =====================
    // DEVICE BARU
    // =====================

    const deviceSecret =
      crypto.randomBytes(32)
      .toString("hex");

    const result =
      await pool.query(
        `
        INSERT INTO devices
        (
          device_id,
          device_secret,
          nama_device,
          status,
          firmware_version,
          created_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          'offline',
          $4,
          NOW()
        )
        RETURNING *
        `,
        [
          device_id,
          deviceSecret,
          nama_device,
          firmware_version
        ]
      );

    
    res.json({
      success: true,
      registered: true,
      device_secret:
        deviceSecret,
      device:
        result.rows[0]
    });

  }

  catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

};

// =====================
// ASSIGN MERCHANT
// =====================

exports.assignMerchant =
async (req, res) => {

  try {

    const {
      device_id,
      merchant_id
    } = req.body;

    const result =
      await pool.query(
        `
        UPDATE devices
        SET merchant_id=$1
        WHERE device_id=$2
        RETURNING *
        `,
        [
          merchant_id,
          device_id
        ]
      );

    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        success:false,
        error:"Device tidak ditemukan"
      });

    }

    res.json({
      success:true,
      data:result.rows[0]
    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({
      success:false,
      error:err.message
    });

  }

};

// =====================
// HEARTBEAT
// =====================

exports.heartbeat =
async (req,res)=>{

  try{

    console.log(
  "HEARTBEAT:",
  req.body
);

    const {
      device_id
    } = req.body;

    const ipAddress =
      req.ip;

    const result =
      await pool.query(
        `
        UPDATE devices
        SET

          status='online',

          last_ping=NOW(),

          ip_address=$1

        WHERE device_id=$2

        RETURNING *
        `,
        [
          ipAddress,
          device_id
        ]
      );

    if(
      result.rows.length===0
    ){

      return res.status(404).json({
        success:false,
        error:"Device tidak ditemukan"
      });

    }

    res.json({
      success:true
    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({
      success:false,
      error:err.message
    });

  }

};