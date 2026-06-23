require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const requirePermission = require("../middleware/requirePermission");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const { JWT_SECRET } = require("../config/authSecrets");

const router = express.Router();

function buildPlatformJwtPayload(user) {
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: "platform_superadmin",
    tenant_id: null,
    platform: true,
  };
}

function buildPlatformUserResponse(user, permissions) {
  return {
    id: user.id,
    nama: user.nama,
    username: user.username,
    role: user.role,
    tenant_id: null,
    platform: true,
    permissions,
  };
}

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username dan password wajib diisi",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE username = $1
         AND tenant_id IS NULL
         AND role = 'platform_superadmin'`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User platform tidak ditemukan",
      });
    }

    const user = result.rows[0];
    const stored = user.password || "";

    const isBcrypt =
      stored.startsWith("$2a$") ||
      stored.startsWith("$2b$") ||
      stored.startsWith("$2y$");

    const passwordValid = isBcrypt
      ? await bcrypt.compare(password, stored)
      : stored === password;

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Password salah",
      });
    }

    const token = jwt.sign(buildPlatformJwtPayload(user), JWT_SECRET, {
      expiresIn: "7d",
    });

    const permissions = await requirePermission.getPermissionList(user.role);

    res.json({
      success: true,
      token,
      user: buildPlatformUserResponse(user, permissions),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/me", platformAuthMiddleware, async (req, res) => {
  try {
    const permissions = await requirePermission.getPermissionList(
      req.platformUser.role
    );

    res.json({
      success: true,
      user: buildPlatformUserResponse(req.platformUser, permissions),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
