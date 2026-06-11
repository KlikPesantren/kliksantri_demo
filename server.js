console.log(
  "SERVER INI YANG JALAN"
);

const express =
  require("express");

const cors =
  require("cors");

const http =
  require("http");

const {

  Server

} = require("socket.io");

const logger =
  require("./middleware/logger");

const notFound =
  require("./middleware/notFound");

const errorHandler =
  require("./middleware/errorHandler");

// =====================
// ROUTES
// =====================

const authRoutes =
  require("./routes/authRoutes");

const santriRoutes =
  require("./routes/santriRoutes");

const transaksiRoutes =
  require("./routes/transaksiRoutes");

const deviceRoutes =
  require("./routes/deviceRoutes");

const auditApi =
  require("./routes/auditApi");

const kelasRoutes =
  require("./routes/kelasRoutes");

const dashboardRoutes =
require("./routes/dashboardRoutes");

const waliRoutes =
require("./routes/waliRoutes");

const pembayaranRoutes =
require("./routes/pembayaranRoutes");

const jenisTagihanRoutes =
require("./routes/jenisTagihanRoutes");

const absensiRoutes =
require("./routes/absensiRoutes");

const perizinanRoutes =
require("./routes/perizinanRoutes");

const pelanggaranRoutes =
require("./routes/pelanggaranRoutes");

const hafalanRoutes =
require("./routes/hafalanRoutes");

const nilaiRoutes =
require("./routes/nilaiRoutes");

const bukuKasRoutes =
require( "./routes/bukuKasRoutes" );

const sahriyahRoutes =
require( "./routes/sahriyahRoutes" );

const sahriyahSettingRoutes =
require(
"./routes/sahriyahSettingRoutes"
);

const tamuRoutes =
require("./routes/tamuRoutes");

const rfidRoutes =
require("./routes/rfidRoutes");

const rfidMerchantRoutes =
require(
"./routes/rfidMerchantRoutes"
);

const rfidDeviceRoutes =
require(
"./routes/rfidDeviceRoutes"
);

const rfidSyncRoutes =
require(
"./routes/rfidSyncRoutes"
);

const rfidMonitorRoutes =
require("./routes/rfidMonitorRoutes");

const rfidAuditRoutes =
require(
"./routes/rfidAuditRoutes"
);

const waliAppRoutes =
require("./routes/waliAppRoutes");

const pengumumanRoutes =
require("./routes/pengumumanRoutes");

const profilPesantrenRoutes =
require("./routes/profilPesantrenRoutes");

const userRoutes =
require("./routes/userRoutes");

const roleRoutes =
require("./routes/roleRoutes");

const guruRoutes =
require("./routes/guruRoutes");
// =====================
// RBAC MIDDLEWARE
// =====================

const authMiddleware =
  require("./middleware/authMiddleware");

const requirePermission =
  require("./middleware/requirePermission");

// =====================
// DB
// =====================

const pool =
  require("./db");

// =====================
// APP
// =====================

const app =
  express();

const server =
  http.createServer(app);

const io =
  new Server(

    server,

    {

      cors: {

        origin:
          "http://localhost:5173",

        methods: [

          "GET",
          "POST",
          "PUT",
          "DELETE"

        ]

      }

    }

);

app.set("io", io);

// =====================
// MIDDLEWARE
// =====================

app.use(cors());

app.use(express.json());

app.use(logger);

// =====================
// ROOT
// =====================

app.get(

  "/",

  (req, res) => {

    res.send(

      "API Administrasi Santri Digital AKTIF"

    );

  }

);

// =====================
// ROUTES
// =====================

app.use(

  "/auth",

  authRoutes

);

app.use(

  "/santri",

  santriRoutes

);

app.use(

  "/transaksi",

  transaksiRoutes

);

app.use(

  "/devices",

  deviceRoutes

);

app.use(

  "/audit",

  authMiddleware,
  requirePermission("audit.view"),

  auditApi

);

app.use(

  "/kelas",

  kelasRoutes

);

app.use(
  "/dashboard",
  authMiddleware,
  requirePermission("dashboard.view"),
  dashboardRoutes
);

app.use(
  "/wali",
  authMiddleware,
  requirePermission("wali.view"),
  waliRoutes
);

app.use(
  "/pembayaran",
  authMiddleware,
  requirePermission("pembayaran.view"),
  pembayaranRoutes
);

app.use(
  "/jenis-tagihan",
  authMiddleware,
  requirePermission("tagihan.view"),
  jenisTagihanRoutes
);

app.use(
  "/absensi",
  authMiddleware,
  requirePermission("absensi.view"),
  absensiRoutes
);

app.use(
  "/perizinan",
  authMiddleware,
  requirePermission("perizinan.view"),
  perizinanRoutes
);

app.use(
  "/pelanggaran",
  authMiddleware,
  requirePermission("pelanggaran.view"),
  pelanggaranRoutes
);

app.use(
  "/hafalan",
  authMiddleware,
  requirePermission("hafalan.view"),
  hafalanRoutes
);

app.use(
  "/nilai",
  authMiddleware,
  requirePermission("nilai.view"),
  nilaiRoutes
);

app.use(
  "/pengumuman",
  authMiddleware,
  requirePermission("pengumuman.view"),
  pengumumanRoutes
);

app.use(
  "/profil-pesantren",
  authMiddleware,
  requirePermission("profil.view"),
  profilPesantrenRoutes
);

app.use(
  "/users",
  userRoutes
);

app.use(
  "/roles",
  roleRoutes
);

app.use(
  "/guru", guruRoutes);

app.use(

  "/absensi-guru",

  authMiddleware,
  requirePermission("absensi_guru.view"),

  require(

    "./routes/absensiGuruRoutes"

  )

);

app.use(

  "/buku-kas",

  authMiddleware,
  requirePermission("bukukas.view"),

  bukuKasRoutes

);

app.use(
"/sahriyah",
authMiddleware,
requirePermission("sahriyah.view"),
sahriyahRoutes
);

app.use(
"/sahriyah-setting",
authMiddleware,
requirePermission("sahriyah.manage"),
sahriyahSettingRoutes
);

app.use(
  "/tamu",
  authMiddleware,
  requirePermission("tamu.view"),
  tamuRoutes
);

app.use(
  "/rfid",
  rfidRoutes
);

app.use(
  "/rfid/merchant",
  rfidMerchantRoutes
);

app.use(
  "/rfid/device",
  rfidDeviceRoutes
);

app.use(
  "/rfid/sync",
  rfidSyncRoutes
);

app.use(
  "/rfid/monitor",
  rfidMonitorRoutes
);

app.use(
  "/rfid/audit",
  rfidAuditRoutes
);

app.use(
  "/wali-app",
  waliAppRoutes
);

// =====================
// UPDATE SANTRI
// =====================

app.put(

  "/santri/:id",

  async (req, res) => {

    try {

      const {

        id

      } = req.params;

      const {

        nama,
        kelas,
        kamar,
        limit_harian

      } = req.body;

      const result =
        await pool.query(

          `

          UPDATE santri

          SET

            nama = $1,
            kelas = $2,
            kamar = $3,
            limit_harian = $4

          WHERE id = $5

          RETURNING *

          `,

          [

            nama,
            kelas,
            kamar,
            limit_harian,
            id

          ]

        );

      res.json({

        success: true,

        data:
          result.rows[0]

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Update Failed"

      });

    }
  }

);

// =====================
// DELETE SANTRI
// =====================

app.delete(

  "/santri/:id",

  async (req, res) => {

    try {

      const {

        id

      } = req.params;

      await pool.query(

        "DELETE FROM santri WHERE id = $1",

        [id]

      );

      res.json({

        success: true,

        message:
          "Santri deleted"

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Delete Failed"

      });

    }
  }

);

// =====================
// ERROR HANDLER
// =====================

app.use(notFound);

app.use(errorHandler);

// =====================
// SOCKET
// =====================

io.on(

  "connection",

  (socket) => {

    console.log(

      "SOCKET CONNECTED:",
      socket.id

    );

    socket.on(

      "disconnect",

      () => {

        console.log(

          "SOCKET DISCONNECTED:",
          socket.id

        );

      }

    );

  }

);

// =====================
// START SERVER
// =====================

const PORT =
  process.env.PORT || 3000;

server.listen(

  PORT,

  () => {

    console.log(

      `SERVER RUNNING PORT ${PORT}`

    );

  }

);