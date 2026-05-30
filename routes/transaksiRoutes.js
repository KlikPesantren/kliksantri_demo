const express =
  require("express");

const pool =
  require("../db");

const router =
  express.Router();

// =====================
// DASHBOARD STATS
// =====================

router.get(

  "/dashboard/stats",

  async (req, res) => {

    try {

      const santri =
        await pool.query(

          `SELECT COUNT(*) FROM santri`

        );

      const saldo =
        await pool.query(

          `SELECT
            COALESCE(
              SUM(saldo),
              0
            ) as total
           FROM santri`

        );

      const transaksi =
        await pool.query(

          `SELECT COUNT(*) FROM transaksi`

        );

      let totalDevice = 0;

      try {

        const device =
          await pool.query(

            `SELECT COUNT(*)
             FROM devices
          WHERE status IS TRUE`

          );

        totalDevice =

          Number(
            device.rows[0].count
          );

      }

      catch {

        totalDevice = 0;

      }

      res.json({

        total_santri:

          Number(
            santri.rows[0].count
          ),

        total_saldo:

          Number(
            saldo.rows[0].total
          ),

        total_transaksi:

          Number(
            transaksi.rows[0].count
          ),

        total_device:
          totalDevice

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Server Error"

      });

    }

  }

);

// =====================
// GET TRANSAKSI
// =====================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =
        await pool.query(

          `SELECT

            transaksi.*,

            santri.nama
            as nama_santri

           FROM transaksi

           JOIN santri

           ON transaksi.santri_id = santri.id

           ORDER BY transaksi.id DESC`

        );

      res.json(

        result.rows

      );

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Server Error"

      });

    }

  }

);

// =====================
// RFID TRANSAKSI / TOPUP
// =====================

router.post(

  "/rfid",

  async (req, res) => {

    try {

      const {

  uid_rfid,
  nominal,
  is_topup,
  device_id,
  device_secret,
  override_limit,
  trx_id

} = req.body;

console.log(

  "TRX ID:",

  trx_id

);

// =====================
// CEK DUPLICATE
// =====================

const duplicate =

  await pool.query(

    `SELECT id
     FROM transaksi
     WHERE trx_id = $1`,

    [trx_id]

  );

if (

  duplicate.rows.length > 0

) {

  return res.json({

    success: true,

    message:
      "Duplicate ignored"

  });
}

      const santri =
        await pool.query(

          `SELECT *
           FROM santri
           WHERE uid_rfid = $1`,

          [uid_rfid]

        );

      if (

        santri.rows.length
        === 0

      ) {

        return res.status(404).json({

          success: false,

          error:
            "Santri tidak ditemukan"

        });

      }

      const data =
        santri.rows[0];

      const saldo =
        Number(data.saldo);

      const nominalInt =
        Number(nominal);

      const limitHarian =

        Number(
          data.limit_harian || 0
        );

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const trxHariIni =
        await pool.query(

          `SELECT

            COALESCE(
              SUM(nominal),
              0
            ) as total

           FROM transaksi

           WHERE santri_id = $1

           AND jenis = 'pembayaran'

           AND created_at >= $2`,

          [

            data.id,
            today

          ]

        );

      const totalHariIni =

        Number(
          trxHariIni.rows[0].total
        );

      if (

  !override_limit

  &&

  !is_topup

        &&

        limitHarian > 0

        &&

        totalHariIni + nominalInt

          >

          limitHarian

      ) {

        return res.json({

          success: false,

          error:
            "Limit Harian"

        });

      }

      if (

        !is_topup

        &&

        saldo < nominalInt

      ) {

        return res.json({

          success: false,

          error:
            "Saldo Kurang"

        });

      }

      const saldoBaru =

        is_topup

          ?

          saldo + nominalInt

          :

          saldo - nominalInt;

      await pool.query(

        `UPDATE santri
         SET saldo = $1
         WHERE uid_rfid = $2`,

        [

          saldoBaru,
          uid_rfid

        ]

      );

     await pool.query(

  `INSERT INTO transaksi
  (

    santri_id,
    jenis,
    nominal,
    keterangan,
    created_at,
    trx_id

  )

  VALUES

  (

    $1,
    $2,
    $3,
    $4,
    NOW(),
    $5

  )`,

  [

    data.id,

    is_topup

      ?

      "topup"

      :

      "pembayaran",

    nominalInt,

    is_topup

      ?

      "Topup RFID"

      :

      "Transaksi RFID",

    trx_id

  ]

);

      const io =

        req.app.get("io");

      io.emit(

        "transaksi_baru",

        {

          nama:
            data.nama,

          nominal:
            nominalInt,

          saldo:
            saldoBaru,

          jenis:

            is_topup

              ?

              "topup"

              :

              "pembayaran"

        }

      );

      return res.json({

        success: true,

        saldo_sekarang:
          saldoBaru

      });

    }

    catch (err) {

      console.log(err);

      return res.status(500).json({

        success: false,

        error:
          "Server Error"

      });

    }

  }

);

module.exports =
  router;