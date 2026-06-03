const pool = require("../db");
const auditService = require("../services/auditService");

const crypto = require("crypto");
// ==========================
// RFID PAYMENT
// ==========================

exports.rfidPayment = async (req, res) => {
  try {
    const {
      uid_rfid,
      nominal,
      device_id,
      trx_id,
      override_limit = false
    } = req.body;

    // ==========================
    // VALIDASI SANTRI
    // ==========================

    const santriResult = await pool.query(
      `
      SELECT *
      FROM santri
      WHERE uid_rfid = $1
      `,
      [uid_rfid]
    );

    if (santriResult.rows.length === 0) {
      return res.json({
        success: false,
        error: "Kartu tidak terdaftar"
      });
    }

    const santri = santriResult.rows[0];

    // ==========================
    // DUPLICATE CHECK
    // ==========================

    const duplicate = await pool.query(
      `
      SELECT id
      FROM transaksi_rfid
      WHERE trx_id = $1
      `,
      [trx_id]
    );

    if (duplicate.rows.length > 0) {
      return res.json({
        success: true,
        message: "Duplicate ignored",
        saldo_sekarang: santri.saldo
      });
    }

    // ==========================
    // DEVICE
    // ==========================

    const deviceResult = await pool.query(
      `
      SELECT *
      FROM devices
      WHERE device_id = $1
      `,
      [device_id]
    );

    if (deviceResult.rows.length === 0) {
      return res.json({
        success: false,
        error: "Device tidak terdaftar"
      });
    }

    const device = deviceResult.rows[0];
   // ==========================
    // SALDO
    // ==========================

    if (
      Number(santri.saldo) <
      Number(nominal)
    ) {
      return res.json({
        success: false,
        error: "Saldo tidak cukup"
      });
    }

    const saldoAwal =
      Number(santri.saldo);

    const saldoAkhir =
      saldoAwal - Number(nominal);

    // ==========================
    // LIMIT HARIAN
    // ==========================

    const todayUsage = await pool.query(
      `
      SELECT
      COALESCE(SUM(nominal),0) total
      FROM transaksi_rfid
      WHERE santri_id = $1
      AND DATE(created_at)=CURRENT_DATE
      `,
      [santri.id]
    );

    const totalHariIni =
      Number(todayUsage.rows[0].total);

    const limit =
      Number(santri.limit_harian || 0);

    if (
      !override_limit &&
      totalHariIni + Number(nominal) > limit
    ) {
      return res.json({
        success: false,
        error: "Limit harian habis"
      });
    }

 
    // ==========================
    // TRANSACTION
    // ==========================

    const client =
      await pool.connect();

    try {

      await client.query("BEGIN");

      await client.query(
        `
        UPDATE santri
        SET saldo = $1
        WHERE id = $2
        `,
        [
          saldoAkhir,
          santri.id
        ]
      );

      const trxUuid =
        crypto.randomUUID();

      await client.query(
        `
        INSERT INTO transaksi_rfid
        (
          trx_uuid,
          trx_id,
          santri_id,
          merchant_id,
          device_id,
          nominal,
          saldo_awal,
          saldo_akhir,
          is_override,
          sync_status
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,'synced'
        )
        `,
        [
          trxUuid,
          trx_id,
          santri.id,
          device.merchant_id,
          device.id,
          nominal,
          saldoAwal,
          saldoAkhir,
          override_limit
        ]
      );

      await client.query(
        `
        INSERT INTO transaksi
        (
          santri_id,
          jenis,
          nominal,
          keterangan,
          trx_id
        )
        VALUES
        (
          $1,
          'RFID',
          $2,
          'Pembayaran RFID',
          $3
        )
        `,
        [
          santri.id,
          nominal,
          trx_id
        ]
      );

      await client.query("COMMIT");

       // await auditService(
       // null,
       // "RFID_PAYMENT",
      // `${santri.nama} | Rp ${nominal}`
     //);

      return res.json({
        success: true,
        saldo_sekarang: saldoAkhir
      });

    } catch (err) {

      await client.query(
        "ROLLBACK"
      );

      throw err;

    } finally {

      client.release();

    }

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
};

// ==========================
// DASHBOARD RFID
// ==========================

exports.getDashboard =
  async (req, res) => {

    try {

      const result =
        await pool.query(`
        SELECT

        (SELECT COUNT(*) FROM merchant_rfid)
        AS total_merchant,

        (SELECT COUNT(*) FROM devices)
        AS total_device,

        (SELECT COUNT(*) FROM transaksi_rfid)
        AS total_transaksi,

        (
          SELECT COALESCE(SUM(saldo),0)
          FROM santri
        )
        AS total_saldo
      `);

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false
      });

    }

};

// ==========================
// RFID TRANSACTIONS
// ==========================

exports.getTransactions =
  async (req, res) => {

    try {

      const result =
        await pool.query(`
        SELECT
          t.*,
          s.nama,
          m.nama_merchant
        FROM transaksi_rfid t

        LEFT JOIN santri s
        ON t.santri_id=s.id

        LEFT JOIN merchant_rfid m
        ON t.merchant_id=m.id

        ORDER BY t.id DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false
      });

    }

};