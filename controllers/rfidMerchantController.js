const pool = require("../db");

exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM merchant_rfid
       WHERE tenant_id = $1
       ORDER BY id DESC`,
      [req.tenantId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

exports.create = async (req, res) => {
  try {
    const { nama_merchant } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO merchant_rfid (nama_merchant, tenant_id)
       VALUES ($1, $2)
       RETURNING *`,
      [nama_merchant, req.tenantId]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_merchant, status } = req.body;

    const { rows } = await pool.query(
      `UPDATE merchant_rfid
       SET nama_merchant = $1, status = $2
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [nama_merchant, status, id, req.tenantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Merchant tidak ditemukan" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM merchant_rfid WHERE id = $1 AND tenant_id = $2`,
      [id, req.tenantId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: "Merchant tidak ditemukan" });
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};
