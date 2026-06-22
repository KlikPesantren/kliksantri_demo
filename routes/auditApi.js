console.log("AUDIT ROUTES LOADED");

const express = require("express");
const router = express.Router();
const pool = require("../db");

// auth + tenantMiddleware applied at server mount

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM audit_logs
       WHERE tenant_id = $1
       ORDER BY id DESC
       LIMIT 100`,
      [req.tenantId],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { device_id, event_type, detail } = req.body;

    await pool.query(
      `INSERT INTO audit_logs (device_id, event_type, detail, tenant_id)
       VALUES ($1, $2, $3, $4)`,
      [device_id, event_type, detail, req.tenantId],
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
