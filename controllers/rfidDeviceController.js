const pool = require("../db");
const crypto = require("crypto");

/**
 * POST /rfid/device/provision — admin creates device for own tenant
 */
exports.provision = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      device_id: deviceId,
      nama_device: namaDevice,
      merchant_id: merchantId,
      firmware_version: firmwareVersion,
    } = req.body;

    if (!deviceId || !String(deviceId).trim()) {
      return res.status(400).json({
        success: false,
        error: "device_id wajib",
      });
    }

    if (merchantId) {
      const { rows: merchantRows } = await pool.query(
        `SELECT id FROM merchant_rfid
         WHERE id = $1 AND tenant_id = $2`,
        [merchantId, tenantId]
      );
      if (merchantRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Merchant tidak valid untuk tenant ini",
        });
      }
    }

    const existing = await pool.query(
      `SELECT id FROM devices WHERE tenant_id = $1 AND device_id = $2`,
      [tenantId, String(deviceId).trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Device ID sudah ada di tenant ini",
      });
    }

    const deviceSecret = crypto.randomBytes(32).toString("hex");

    const { rows } = await pool.query(
      `INSERT INTO devices (
         device_id, device_secret, nama_device, merchant_id,
         status, firmware_version, tenant_id, created_at
       )
       VALUES ($1, $2, $3, $4, 'offline', $5, $6, NOW())
       RETURNING id, device_id, nama_device, merchant_id, tenant_id, status, created_at`,
      [
        String(deviceId).trim(),
        deviceSecret,
        namaDevice || String(deviceId).trim(),
        merchantId || null,
        firmwareVersion || null,
        tenantId,
      ]
    );

    res.status(201).json({
      success: true,
      registered: true,
      device_secret: deviceSecret,
      device: rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /rfid/device/register — legacy self-register (tenant_slug wajib)
 */
exports.register = async (req, res) => {
  try {
    const { resolveTenantForLogin } = require("../services/tenantService");
    const tenantResult = await resolveTenantForLogin(req.body.tenant_slug);
    if (tenantResult.error) {
      return res.status(tenantResult.status || 400).json({
        success: false,
        error: tenantResult.error,
      });
    }
    const tenantId = tenantResult.tenant.id;
    const { device_id: deviceId, nama_device: namaDevice, firmware_version: firmwareVersion } =
      req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, error: "device_id wajib" });
    }

    const existing = await pool.query(
      `SELECT * FROM devices WHERE tenant_id = $1 AND device_id = $2`,
      [tenantId, deviceId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (req.body.device_secret && req.body.device_secret !== row.device_secret) {
        return res.status(401).json({
          success: false,
          error: "Device secret tidak valid",
        });
      }

      await pool.query(
        `UPDATE devices
         SET last_ping = NOW(), firmware_version = $1
         WHERE tenant_id = $2 AND device_id = $3`,
        [firmwareVersion || null, tenantId, deviceId]
      );

      return res.json({
        success: true,
        registered: false,
        device_secret: row.device_secret,
      });
    }

    const deviceSecret = crypto.randomBytes(32).toString("hex");

    const { rows } = await pool.query(
      `INSERT INTO devices (
         device_id, device_secret, nama_device, status, firmware_version, tenant_id, created_at
       )
       VALUES ($1, $2, $3, 'offline', $4, $5, NOW())
       RETURNING *`,
      [deviceId, deviceSecret, namaDevice || deviceId, firmwareVersion || null, tenantId]
    );

    res.json({
      success: true,
      registered: true,
      device_secret: deviceSecret,
      device: rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.assignMerchant = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { device_id: deviceId, merchant_id: merchantId } = req.body;

    const { rows: merchantRows } = await pool.query(
      `SELECT id FROM merchant_rfid WHERE id = $1 AND tenant_id = $2`,
      [merchantId, tenantId]
    );

    if (merchantRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Merchant tidak valid untuk tenant ini",
      });
    }

    const result = await pool.query(
      `UPDATE devices
       SET merchant_id = $1
       WHERE tenant_id = $2 AND device_id = $3
       RETURNING *`,
      [merchantId, tenantId, deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Device tidak ditemukan",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.heartbeat = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { device_id: deviceId } = req.body;
    const ipAddress = req.ip;

    const result = await pool.query(
      `UPDATE devices
       SET status = 'online', last_ping = NOW(), ip_address = $1
       WHERE tenant_id = $2 AND device_id = $3
       RETURNING *`,
      [ipAddress, tenantId, deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Device tidak ditemukan",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * List devices for admin tenant
 */
exports.list = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, m.nama_merchant
       FROM devices d
       LEFT JOIN merchant_rfid m ON m.id = d.merchant_id AND m.tenant_id = d.tenant_id
       WHERE d.tenant_id = $1
       ORDER BY d.id DESC`,
      [req.tenantId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
};
