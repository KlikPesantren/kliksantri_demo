const pool = require("../db");
const { resolveTenantForLogin } = require("../services/tenantService");

/**
 * Authenticate RFID device within tenant context.
 * Body: device_id, device_secret, tenant_slug (optional → default)
 */
async function deviceAuthMiddleware(req, res, next) {
  try {
    const deviceId =
      req.body?.device_id ||
      req.headers["x-device-id"] ||
      req.query?.device_id;

    const deviceSecret =
      req.body?.device_secret ||
      req.headers["x-device-secret"] ||
      req.query?.device_secret;

    const tenantSlug =
      req.body?.tenant_slug ||
      req.headers["x-tenant-slug"] ||
      req.query?.tenant_slug;

    if (!deviceId || !deviceSecret) {
      return res.status(401).json({
        success: false,
        error: "device_id dan device_secret wajib",
      });
    }

    const tenantResult = await resolveTenantForLogin(tenantSlug);
    if (tenantResult.error) {
      return res.status(tenantResult.status || 400).json({
        success: false,
        error: tenantResult.error,
        message: tenantResult.error,
      });
    }

    const tenantId = tenantResult.tenant.id;

    const { rows } = await pool.query(
      `SELECT d.*, m.tenant_id AS merchant_tenant_id, m.nama_merchant
       FROM devices d
       LEFT JOIN merchant_rfid m ON m.id = d.merchant_id
       WHERE d.device_id = $1
         AND d.device_secret = $2
         AND d.tenant_id = $3`,
      [deviceId, deviceSecret, tenantId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Device tidak valid",
      });
    }

    const device = rows[0];

    if (device.status === false || device.status === "false") {
      return res.status(403).json({
        success: false,
        error: "Device nonaktif",
      });
    }

    if (
      device.merchant_id &&
      device.merchant_tenant_id &&
      Number(device.merchant_tenant_id) !== Number(tenantId)
    ) {
      return res.status(403).json({
        success: false,
        error: "Merchant device tidak valid untuk tenant ini",
      });
    }

    req.tenantId = tenantId;
    req.tenantSlug = tenantResult.tenant.slug;
    req.device = device;

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: "Device auth gagal",
    });
  }
}

module.exports = deviceAuthMiddleware;
