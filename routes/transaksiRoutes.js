const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const deviceAuthMiddleware = require("../middleware/deviceAuthMiddleware");
const rfidController = require("../controllers/rfidController");

const router = express.Router();

const withTenant = [authMiddleware, tenantMiddleware];

// Legacy global stats removed (Step 3.2.1) — use GET /dashboard/summary or GET /rfid/dashboard
router.get("/dashboard/stats", (_req, res) => {
  res.status(410).json({
    success: false,
    error:
      "Endpoint deprecated. Gunakan GET /dashboard/summary (tenant admin) atau GET /rfid/dashboard.",
  });
});

// =====================
// GET TRANSAKSI (tenant-scoped)
// =====================

router.get("/", ...withTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         transaksi.*,
         santri.nama AS nama_santri
       FROM transaksi
       JOIN santri
         ON transaksi.santri_id = santri.id
        AND santri.tenant_id = transaksi.tenant_id
       WHERE transaksi.tenant_id = $1
       ORDER BY transaksi.id DESC
       LIMIT 500`,
      [req.tenantId],
    );

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
});

// Legacy alias — delegates to /rfid/payment (device-auth + tenant scoped)
router.post("/rfid", deviceAuthMiddleware, rfidController.rfidPayment);

module.exports = router;
