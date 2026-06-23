require("dotenv").config();

const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET } = require("../config/authSecrets");

/**
 * Authenticate platform superadmin JWT (tenant_id must be null).
 * Sets req.platformUser and req.user for permission checks.
 */
async function platformAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Token tidak ada",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        error: "Token tidak valid",
      });
    }

    if (decoded.platform !== true) {
      return res.status(403).json({
        success: false,
        error: "Token bukan platform admin",
      });
    }

    if (decoded.role !== "platform_superadmin") {
      return res.status(403).json({
        success: false,
        error: "Role platform tidak valid",
      });
    }

    if (decoded.tenant_id != null) {
      return res.status(403).json({
        success: false,
        error: "Token platform tidak valid",
      });
    }

    const { rows } = await pool.query(
      `SELECT id, nama, username, role, status, tenant_id
       FROM users
       WHERE id = $1
         AND tenant_id IS NULL
         AND role = 'platform_superadmin'`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User platform tidak ditemukan",
      });
    }

    const user = rows[0];

    if (user.status && user.status !== "Aktif") {
      return res.status(403).json({
        success: false,
        error: "Akun platform tidak aktif",
      });
    }

    req.platformUser = {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
      tenant_id: null,
      platform: true,
    };

    req.user = req.platformUser;

    next();
  } catch (err) {
    console.error("[platformAuthMiddleware]", err);
    return res.status(500).json({
      success: false,
      error: "Gagal memverifikasi token platform",
    });
  }
}

module.exports = platformAuthMiddleware;
