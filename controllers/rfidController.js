const pool = require("../db");
const auditService = require("../services/auditService");

const crypto = require("crypto");

const XLSX = require("xlsx");
// ==========================
// RFID PAYMENT
// ==========================

exports.rfidPayment = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      uid_rfid,
      nominal,
      device_id,
      trx_id,
      override_limit = false
    } = req.body;

    const santriResult = await pool.query(
      `
      SELECT *
      FROM santri
      WHERE uid_rfid = $1
        AND tenant_id = $2
      `,
      [uid_rfid, tenantId]
    );

    if (santriResult.rows.length === 0) {
      return res.json({
        success: false,
        error: "Kartu tidak terdaftar"
      });
    }

    const santri = santriResult.rows[0];

    const duplicate = await pool.query(
      `
      SELECT id
      FROM transaksi_rfid
      WHERE trx_id = $1
        AND tenant_id = $2
      `,
      [trx_id, tenantId]
    );

    if (duplicate.rows.length > 0) {
      return res.json({
        success: true,
        message: "Duplicate ignored",
        saldo_sekarang: santri.saldo
      });
    }

    const device = req.device;
    if (!device || String(device.device_id) !== String(device_id)) {
      return res.json({
        success: false,
        error: "Device tidak terdaftar"
      });
    }
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
          AND tenant_id = $3
        `,
        [
          saldoAkhir,
          santri.id,
          tenantId
        ]
      );

      const trxUuid =
        crypto.randomUUID();

      console.log("PAYMENT MASUK");
console.log({
  uid_rfid,
  nominal,
  device_id,
  trx_id
});

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
          sync_status,
          tenant_id
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,'synced',$10
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
          override_limit,
          tenantId
        ]
      );

      console.log(
  "INSERT transaksi_rfid BERHASIL"
);

      await client.query(
        `
        INSERT INTO transaksi
        (
          santri_id,
          jenis,
          nominal,
          keterangan,
          trx_id,
          tenant_id
        )
        VALUES
        (
          $1,
          'RFID',
          $2,
          'Pembayaran RFID',
          $3,
          $4
        )
        `,
        [
          santri.id,
          nominal,
          trx_id,
          tenantId
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
async (req,res)=>{

  try{
    const tenantId = req.tenantId;

    const totalSaldo =
      await pool.query(`
        SELECT COALESCE(SUM(saldo), 0) total
        FROM santri
        WHERE tenant_id = $1
      `, [tenantId]);

    const totalMerchant =
      await pool.query(`
        SELECT COUNT(*)
        FROM merchant_rfid
        WHERE status=true AND tenant_id = $1
      `, [tenantId]);

    const totalDevice =
      await pool.query(`
        SELECT COUNT(*)
        FROM devices
        WHERE tenant_id = $1
      `, [tenantId]);

    const online =
      await pool.query(`
        SELECT COUNT(*)
        FROM devices
        WHERE status='online' AND tenant_id = $1
      `, [tenantId]);

    const offline =
      await pool.query(`
        SELECT COUNT(*)
        FROM devices
        WHERE status!='online' AND tenant_id = $1
      `, [tenantId]);

    const transaksiHariIni =
      await pool.query(`
        SELECT COALESCE(SUM(nominal), 0) total
        FROM transaksi_rfid
        WHERE DATE(created_at) = CURRENT_DATE
          AND tenant_id = $1
      `, [tenantId]);

    const pending =
      await pool.query(`
        SELECT COUNT(*)
        FROM rfid_sync_queue
        WHERE sync_status='pending' AND tenant_id = $1
      `, [tenantId]);

    const failed =
      await pool.query(`
        SELECT COUNT(*)
        FROM rfid_sync_queue
        WHERE sync_status='failed' AND tenant_id = $1
      `, [tenantId]);

    const kartuAktif =
      await pool.query(`
        SELECT COUNT(*)
        FROM santri
        WHERE uid_rfid IS NOT NULL
          AND tenant_id = $1
      `, [tenantId]);

    res.json({

      total_saldo:
        totalSaldo.rows[0].total,

      belanja_hari_ini:
        transaksiHariIni.rows[0].total,

      merchant_aktif:
        totalMerchant.rows[0].count,

      total_device:
        totalDevice.rows[0].count,

      device_online:
        online.rows[0].count,

      device_offline:
        offline.rows[0].count,

      pending_sync:
        pending.rows[0].count,

      failed_sync:
        failed.rows[0].count,

      kartu_aktif:
        kartuAktif.rows[0].count

    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({
      success:false
    });

  }

};
// ==========================
// RFID TRANSACTIONS
// ==========================

exports.getTransactions =
async(req,res)=>{

  try{
    const tenantId = req.tenantId;

    const result =
      await pool.query(
        `
        SELECT
          tr.*,
          s.nama AS nama_santri,
          m.nama_merchant,
          d.device_id
        FROM transaksi_rfid tr
        LEFT JOIN santri s
          ON s.id = tr.santri_id AND s.tenant_id = tr.tenant_id
        LEFT JOIN merchant_rfid m
          ON m.id = tr.merchant_id AND m.tenant_id = tr.tenant_id
        LEFT JOIN devices d
          ON d.id = tr.device_id AND d.tenant_id = tr.tenant_id
        WHERE tr.tenant_id = $1
        ORDER BY tr.created_at DESC
        LIMIT 500
        `,
        [tenantId]
      );

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

};

// ==========================
// RFID TOPUP
// ==========================

exports.topupSaldo =
async(req,res)=>{

  const client =
    await pool.connect();

  const tenantId = req.tenantId;

  try{

    const {
      santri_id,
      nominal,
      user_id
    } = req.body;

    await client.query(
      "BEGIN"
    );

    const santri =
      await client.query(
        `
        SELECT *
        FROM santri
        WHERE id=$1
          AND tenant_id=$2
        `,
        [santri_id, tenantId]
      );

    if(
      santri.rows.length===0
    ){
      throw new Error(
        "Santri tidak ditemukan"
      );
    }

    const saldoAwal =
      Number(
        santri.rows[0].saldo
      );

    const saldoAkhir =
      saldoAwal +
      Number(nominal);

        const trxId =
      `TOPUP-${Date.now()}`;

    await client.query(
      `
      UPDATE santri
      SET saldo=$1
      WHERE id=$2
        AND tenant_id=$3
      `,
      [
        saldoAkhir,
        santri_id,
        tenantId
      ]
    );

    await client.query(
`
INSERT INTO transaksi_rfid
(
  trx_uuid,
  trx_id,
  santri_id,
  nominal,
  saldo_awal,
  saldo_akhir,
  trx_type,
  sync_status,
  tenant_id
)
VALUES
(
  gen_random_uuid(),
  $1,
  $2,
  $3,
  $4,
  $5,
  'topup',
  'synced',
  $6
)
`,
[
  trxId,
  santri_id,
  nominal,
  saldoAwal,
  saldoAkhir,
  tenantId
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
        created_by,
        trx_id,
        tenant_id
      )
      VALUES
      (
        $1,
        'TOPUP RFID',
        $2,
        'Topup Saldo RFID',
        $3,
        $4,
        $5
      )
      `,
      [
        santri_id,
        nominal,
        user_id,
        trxId,
        tenantId
      ]
    );

    await client.query(
      `
      INSERT INTO buku_kas
      (
        tanggal,
        jenis,
        kategori,
        keterangan,
        nominal,
        tenant_id
      )
      VALUES
      (
        CURRENT_DATE,
        'Masuk',
        'RFID Topup',
        $1,
        $2,
        $3
      )
      `,
      [
        santri.rows[0].nama,
        nominal,
        tenantId
      ]
    );

   await client.query(
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
    "BACKEND",
    "RFID_TOPUP",
    `${santri.rows[0].nama} | Rp ${nominal}`
  ]
);

    await client.query(
      "COMMIT"
    );

    res.json({
      success:true,
      saldo_awal:
        saldoAwal,
      saldo_akhir:
        saldoAkhir
    });

  }

  catch(err){

    await client.query(
      "ROLLBACK"
    );

    console.log(err);

    res.status(500).json({
      success:false,
      error:err.message
    });

  }

  finally{

    client.release();

  }

};

exports.exportTransactions =
async(req,res)=>{

  try{
    const tenantId = req.tenantId;

    const result =
      await pool.query(`
        SELECT
          tr.created_at,
          s.nama AS nama_santri,
          m.nama_merchant,
          d.device_id,
          tr.nominal,
          tr.saldo_awal,
          tr.saldo_akhir,
          tr.sync_status
        FROM transaksi_rfid tr
        LEFT JOIN santri s ON s.id = tr.santri_id AND s.tenant_id = tr.tenant_id
        LEFT JOIN merchant_rfid m ON m.id = tr.merchant_id AND m.tenant_id = tr.tenant_id
        LEFT JOIN devices d ON d.id = tr.device_id AND d.tenant_id = tr.tenant_id
        WHERE tr.tenant_id = $1
        ORDER BY tr.created_at DESC
      `, [tenantId]);

    const worksheet =
      XLSX.utils.json_to_sheet(
        result.rows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "RFID Transactions"
    );

    const buffer =
      XLSX.write(
        workbook,
        {
          type:"buffer",
          bookType:"xlsx"
        }
      );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=rfid-transactions.xlsx"
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  }

  catch(err){

    console.log(err);

    res.status(500).json({
      success:false
    });

  }

};

exports.exportTopup =
async(req,res)=>{

  try{
    const tenantId = req.tenantId;

    const result =
      await pool.query(`
        SELECT
          t.created_at,
          s.nama,
          t.nominal,
          t.created_by,
          t.trx_id
        FROM transaksi t
        LEFT JOIN santri s ON s.id = t.santri_id AND s.tenant_id = t.tenant_id
        WHERE t.jenis = 'TOPUP RFID'
          AND t.tenant_id = $1
        ORDER BY t.created_at DESC
      `, [tenantId]);

    const worksheet =
      XLSX.utils.json_to_sheet(
        result.rows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "RFID Topup"
    );

    const buffer =
      XLSX.write(
        workbook,
        {
          type:"buffer",
          bookType:"xlsx"
        }
      );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=rfid-topup.xlsx"
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  }

  catch(err){

    console.log(err);

    res.status(500).json({
      success:false
    });

  }

};

exports.refundTransaction =
async(req,res)=>{

  const client =
    await pool.connect();

  const tenantId = req.tenantId;

  try{

    const {
      transaksi_id
    } = req.body;

    await client.query(
      "BEGIN"
    );

    const trx =
      await client.query(
        `
        SELECT *
        FROM transaksi_rfid
        WHERE id=$1
          AND tenant_id=$2
        `,
        [transaksi_id, tenantId]
      );

    if(
      trx.rows.length===0
    ){
      throw new Error(
        "Transaksi tidak ditemukan"
      );
    }

    const data =
      trx.rows[0];

    const santri =
      await client.query(
        `
        SELECT *
        FROM santri
        WHERE id=$1
          AND tenant_id=$2
        `,
        [data.santri_id, tenantId]
      );

    const saldoAwal =
      Number(
        santri.rows[0].saldo
      );

    const saldoAkhir =
      saldoAwal +
      Number(data.nominal);

    await client.query(
      `
      UPDATE santri
      SET saldo=$1
      WHERE id=$2
        AND tenant_id=$3
      `,
      [
        saldoAkhir,
        data.santri_id,
        tenantId
      ]
    );

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
        trx_type,
        sync_status,
        tenant_id
      )
      VALUES
      (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        'refund',
        'synced',
        $8
      )
      `,
      [
        `REFUND-${Date.now()}`,
        data.santri_id,
        data.merchant_id,
        data.device_id,
        data.nominal,
        saldoAwal,
        saldoAkhir,
        tenantId
      ]
    );

    await client.query(
      `
      INSERT INTO audit_logs
      (
        device_id,
        event_type,
        detail
      )
      VALUES
      (
        'BACKEND',
        'RFID_REFUND',
        $1
      )
      `,
      [
        `TRX ${data.trx_id}`
      ]
    );

    await client.query(
      "COMMIT"
    );

    res.json({
      success:true
    });

  }

  catch(err){

    await client.query(
      "ROLLBACK"
    );

    res.status(500).json({
      success:false,
      error:err.message
    });

  }

  finally{

    client.release();

  }

};

exports.getMutasi =
async(req,res)=>{

  try{
    const tenantId = req.tenantId;

    const {
      santri_id
    } = req.query;

    const santriCheck = await pool.query(
      `SELECT id FROM santri WHERE id = $1 AND tenant_id = $2`,
      [santri_id, tenantId]
    );
    if (santriCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Santri tidak ditemukan" });
    }

    const result =
      await pool.query(
        `
        SELECT
          tr.created_at,
          tr.trx_type,
          tr.nominal,
          tr.saldo_awal,
          tr.saldo_akhir,
          tr.trx_id,
          s.nama,
          s.uid_rfid,
          s.saldo
        FROM transaksi_rfid tr
        LEFT JOIN santri s ON s.id = tr.santri_id AND s.tenant_id = tr.tenant_id
        WHERE tr.santri_id = $1
          AND tr.tenant_id = $2
        ORDER BY tr.created_at DESC
        `,
        [santri_id, tenantId]
      );

    res.json({
      success:true,
      data:result.rows
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