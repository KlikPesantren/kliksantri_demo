const pool = require("../db");
const crypto = require("crypto");

exports.syncTransactions =
async (req,res)=>{

  try{

    const {
      device_id,
      transactions
    } = req.body;

    const results = [];

    for(
      const trx of transactions
    ){

      const duplicate =
        await pool.query(
          `
          SELECT id
          FROM transaksi_rfid
          WHERE trx_id=$1
          `,
          [trx.trx_id]
        );

      if(
        duplicate.rows.length > 0
      ){

        results.push({
          trx_id:trx.trx_id,
          status:"duplicate"
        });

        continue;
      }

      const santri =
        await pool.query(
          `
          SELECT *
          FROM santri
          WHERE uid_rfid=$1
          `,
          [trx.uid_rfid]
        );

      if(
        santri.rows.length===0
      ){

        results.push({
          trx_id:trx.trx_id,
          status:"santri_not_found"
        });

        continue;
      }

      const s =
        santri.rows[0];

      const saldoAwal =
        Number(s.saldo);

      const saldoAkhir =
        saldoAwal -
        Number(trx.nominal);

      await pool.query(
        `
        UPDATE santri
        SET saldo=$1
        WHERE id=$2
        `,
        [
          saldoAkhir,
          s.id
        ]
      );

      const device =
        await pool.query(
          `
          SELECT *
          FROM devices
          WHERE device_id=$1
          `,
          [device_id]
        );

      const trxUuid =
        crypto.randomUUID();

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
          sync_status
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,$8,'synced'
        )
        `,
        [
          trxUuid,
          trx.trx_id,
          s.id,
          device.rows[0]
            .merchant_id,
          device.rows[0]
            .id,
          trx.nominal,
          saldoAwal,
          saldoAkhir
        ]
      );

      results.push({
        trx_id:trx.trx_id,
        status:"synced"
      });

    }

    await pool.query(
  `
  UPDATE devices
  SET last_sync = NOW()
  WHERE device_id = $1
  `,
  [device_id]
);

res.json({
  success:true,
  results
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