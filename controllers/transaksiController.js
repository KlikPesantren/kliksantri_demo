const pool =
  require("../db");

const createAuditLog =
  require(

    "../services/auditService"

  );

const ExcelJS =
  require("exceljs");

exports.createTransaksi =
  async (req, res) => {

    try {

      const {

        santri_id,
        jenis,
        nominal,
        keterangan

      } = req.body;

      // ambil data santri

      const santriResult =
        await pool.query(

          "SELECT * FROM santri WHERE id = $1",

          [santri_id]

        );

      if (
        santriResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error:
            "Santri tidak ditemukan"

        });

      }

      const santri =
        santriResult.rows[0];

      let saldoBaru =
        santri.saldo;

      // TOPUP

      if (jenis === "topup") {

        saldoBaru += nominal;

      }

      // PEMBAYARAN

      else if (
        jenis === "pembayaran"
      ) {

        if (
          santri.saldo < nominal
        ) {

          return res.status(400).json({

            success: false,

            error:
              "Saldo tidak cukup"

          });

        }

        saldoBaru -= nominal;

      }

      // update saldo

      await pool.query(

        "UPDATE santri SET saldo = $1 WHERE id = $2",

        [

          saldoBaru,

          santri_id

        ]

      );

      // simpan transaksi

      const trxResult =
        await pool.query(

          `INSERT INTO transaksi (

            santri_id,
            jenis,
            nominal,
            keterangan,
            created_by

          )

          VALUES (

            $1,$2,$3,$4,$5

          )

          RETURNING *`,

          [

            santri_id,
            jenis,
            nominal,
            keterangan,
            req.user.id

          ]

        );

      // audit log

      await createAuditLog(

        req.user.id,

        "CREATE_TRANSAKSI",

        `Transaksi ${jenis} sebesar ${nominal}`

      );

      // realtime socket

      const io =
        req.app.get("io");

      io.emit(

        "new_transaksi",

        {

          success: true

        }

      );

      res.json({

        success: true,

        saldo_sekarang:
          saldoBaru,

        transaksi:
          trxResult.rows[0]

      });

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Transaksi gagal"

      });

    }

};

exports.getTransaksi =
  async (req, res) => {

    try {

      const result =
        await pool.query(

          `SELECT

            transaksi.*,

            santri.nama
            AS nama_santri,

            users.nama
            AS admin_input

          FROM transaksi

          LEFT JOIN santri
          ON transaksi.santri_id =
          santri.id

          LEFT JOIN users
          ON transaksi.created_by =
          users.id

          ORDER BY transaksi.id DESC`

        );

      res.json(
        result.rows
      );

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Gagal ambil transaksi"

      });

    }

};

exports.pembayaranRFID =
  async (req, res) => {

    try {

      const {

        uid_rfid,
        nominal

      } = req.body;

      // cari santri

      await pool.query(
  "BEGIN"
);

const santriResult =
  await pool.query(

    `SELECT *

    FROM santri

    WHERE LOWER(uid_rfid)
    = LOWER($1)

    FOR UPDATE`,

    [uid_rfid]

  );

      if (
        santriResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error:
            "Kartu tidak terdaftar"

        });

      }

      const santri =
        santriResult.rows[0];

      // cooldown transaksi

      const recentResult =
        await pool.query(

          `SELECT *

          FROM transaksi

          WHERE santri_id = $1

          ORDER BY id DESC

          LIMIT 1`,

          [santri.id]

        );

      if (
        recentResult.rows.length > 0
      ) {

        const trxTerakhir =
          recentResult.rows[0];

        const now =
          new Date();

        const trxTime =
          new Date(
            trxTerakhir.created_at
          );

        const diff =
          (now - trxTime) / 1000;

        if (diff < 5) {

          return res.status(400).json({

            success: false,

            error:
              "Tunggu beberapa detik"

          });

        }

      }

      // cek status

      if (!santri.status) {

        return res.status(403).json({

          success: false,

          error:
            "Santri tidak aktif"

        });

      }

      // limit harian

      const todayResult =
        await pool.query(

          `SELECT

            COALESCE(
              SUM(nominal),
              0
            ) AS total

          FROM transaksi

          WHERE santri_id = $1

          AND jenis = 'pembayaran'

          AND DATE(created_at)
          = CURRENT_DATE`,

          [santri.id]

        );

      const totalHariIni =
        parseInt(

          todayResult.rows[0]
          .total

        );

      if (

        totalHariIni + nominal
        > santri.limit_harian

      ) {

        return res.status(400).json({

          success: false,

          error:
            "Limit harian habis"

        });

      }

      // cek saldo

      if (
        santri.saldo < nominal
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Saldo tidak cukup"

        });

      }

      const saldoBaru =
        santri.saldo - nominal;

      // update saldo

      await pool.query(

        "UPDATE santri SET saldo = $1 WHERE id = $2",

        [

          saldoBaru,

          santri.id

        ]

      );

      // simpan transaksi

      const trxResult =
        await pool.query(

          `INSERT INTO transaksi (

            santri_id,
            jenis,
            nominal,
            keterangan,
            created_by

          )

          VALUES (

            $1,$2,$3,$4,$5

          )

          RETURNING *`,

          [

            santri.id,

            "pembayaran",

            nominal,

            "Pembayaran RFID",

            1

          ]

        );

      // audit log

      await createAuditLog(

        null,

        "RFID PAYMENT",

        `${santri.nama} bayar ${nominal}`

      );

      // realtime socket

      const io =
        req.app.get("io");

      io.emit(

        "new_transaksi",

        {

          nama:
            santri.nama,

          nominal,

          saldo:
            saldoBaru

        }

      );

      await pool.query(
  "COMMIT"
);

      res.json({

        success: true,

        message:
          "Pembayaran berhasil",

        saldo_sekarang:
          saldoBaru,

        transaksi:
          trxResult.rows[0],

        santri: {

          nama:
            santri.nama,

          kelas:
            santri.kelas

        }

      });

    } catch (err) {

      await pool.query(
  "ROLLBACK"
);

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Pembayaran gagal"

      });

    }

};

exports.getAuditLogs =
  async (req, res) => {

    try {

      const result =
        await pool.query(

          `SELECT

            audit_logs.*,

            users.nama
            AS admin_nama

          FROM audit_logs

          LEFT JOIN users
          ON audit_logs.user_id =
          users.id

          ORDER BY audit_logs.id DESC`

        );

      res.json(
        result.rows
      );

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Gagal ambil audit log"

      });

    }

};

exports.getDashboardStats = async (_req, res) => {
  res.status(410).json({
    success: false,
    error:
      "Endpoint deprecated. Gunakan GET /dashboard/summary atau GET /rfid/dashboard.",
  });
};

exports.exportExcel =
  async (req, res) => {

    try {

      const result =
        await pool.query(

          `SELECT

            transaksi.*,

            santri.nama
            AS nama_santri

          FROM transaksi

          LEFT JOIN santri
          ON transaksi.santri_id =
          santri.id

          ORDER BY transaksi.id DESC`

        );

      const workbook =
        new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet(
          "Transaksi"
        );

      worksheet.columns = [

        {

          header: "ID",

          key: "id",

          width: 10

        },

        {

          header: "Nama Santri",

          key: "nama_santri",

          width: 30

        },

        {

          header: "Jenis",

          key: "jenis",

          width: 20

        },

        {

          header: "Nominal",

          key: "nominal",

          width: 20

        },

        {

          header: "Keterangan",

          key: "keterangan",

          width: 30

        },

        {

          header: "Tanggal",

          key: "created_at",

          width: 30

        }

      ];

      result.rows.forEach(

        (trx) => {

          worksheet.addRow(trx);

        }

      );

      res.setHeader(

        "Content-Type",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

      );

      res.setHeader(

        "Content-Disposition",

        "attachment; filename=laporan_transaksi.xlsx"

      );

      await workbook.xlsx.write(
        res
      );

      res.end();

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Export gagal"

      });

    }

};