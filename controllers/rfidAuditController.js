const pool = require("../db");

exports.getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM audit_logs
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 500`,
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
};
