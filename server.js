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

  auditApi

);

app.use(

  "/kelas",

  kelasRoutes

);

app.use(
  "/dashboard",
  dashboardRoutes
);

app.use(
  "/wali",
  waliRoutes
);

app.use(
  "/pembayaran",
  pembayaranRoutes
);

app.use(
  "/jenis-tagihan",
  jenisTagihanRoutes
);

app.use(
  "/absensi",
  absensiRoutes
);

app.use(
  "/perizinan",
  perizinanRoutes
);

app.use(
  "/pelanggaran",
  pelanggaranRoutes
);

app.use(
  "/hafalan",
  hafalanRoutes
);

app.use(
  "/nilai",
  nilaiRoutes
);

app.use(

  "/guru",

  require(
    "./routes/guruRoutes"
  )

);

app.use(

  "/absensi-guru",

  require(

    "./routes/absensiGuruRoutes"

  )

);

app.use(

  "/buku-kas",

  bukuKasRoutes

);

app.use(
"/sahriyah",
sahriyahRoutes
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