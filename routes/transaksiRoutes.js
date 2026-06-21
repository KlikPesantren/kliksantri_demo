const express = require("express");
const pool = require("../db");
const deviceAuthMiddleware = require("../middleware/deviceAuthMiddleware");
const rfidController = require("../controllers/rfidController");

const router = express.Router();

// Legacy global stats removed (Step 3.2.1) — use GET /dashboard/summary or GET /rfid/dashboard
router.get("/dashboard/stats", (_req, res) => {
  res.status(410).json({
    success: false,
    error:
      "Endpoint deprecated. Gunakan GET /dashboard/summary (tenant admin) atau GET /rfid/dashboard.",
  });
});

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

// Legacy alias — delegates to /rfid/payment (device-auth + tenant scoped)
router.post("/rfid", deviceAuthMiddleware, rfidController.rfidPayment);

module.exports = router;