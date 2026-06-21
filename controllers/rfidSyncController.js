const pool = require("../db");
const crypto = require("crypto");

exports.syncTransactions = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const device = req.device;
    const { device_id, transactions } = req.body;

    if (!device || String(device.device_id) !== String(device_id)) {
      return res.status(401).json({
        success: false,
        error: "Device tidak valid",
      });
    }

    const results = [];

    for (const trx of transactions || []) {
      const duplicate = await pool.query(
        `
        SELECT id
        FROM transaksi_rfid
        WHERE trx_id = $1
          AND tenant_id = $2
        `,
        [trx.trx_id, tenantId]
      );

      if (duplicate.rows.length > 0) {
        results.push({
          trx_id: trx.trx_id,
          status: "duplicate",
        });
        continue;
      }

      const santri = await pool.query(
        `
        SELECT *
        FROM santri
        WHERE uid_rfid = $1
          AND tenant_id = $2
        `,
        [trx.uid_rfid, tenantId]
      );

      if (santri.rows.length === 0) {
        results.push({
          trx_id: trx.trx_id,
          status: "santri_not_found",
        });
        continue;
      }

      const s = santri.rows[0];
      const saldoAwal = Number(s.saldo);
      const saldoAkhir = saldoAwal - Number(trx.nominal);

      await pool.query(
        `
        UPDATE santri
        SET saldo = $1
        WHERE id = $2
          AND tenant_id = $3
        `,
        [saldoAkhir, s.id, tenantId]
      );

      const trxUuid = crypto.randomUUID();

      await pool.query(
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
          sync_status,
          tenant_id
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,$8,'synced',$9
        )
        `,
        [
          trxUuid,
          trx.trx_id,
          s.id,
          device.merchant_id,
          device.id,
          trx.nominal,
          saldoAwal,
          saldoAkhir,
          tenantId,
        ]
      );

      await pool.query(
        `
        INSERT INTO transaksi
        (santri_id, jenis, nominal, keterangan, trx_id, tenant_id)
        VALUES ($1, 'RFID', $2, 'Pembayaran RFID Sync', $3, $4)
        `,
        [s.id, trx.nominal, trx.trx_id, tenantId]
      );

      results.push({
        trx_id: trx.trx_id,
        status: "synced",
      });
    }

    await pool.query(
      `
      UPDATE devices
      SET last_sync = NOW()
      WHERE tenant_id = $1 AND device_id = $2
      `,
      [tenantId, device_id]
    );

    res.json({
      success: true,
      results,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
