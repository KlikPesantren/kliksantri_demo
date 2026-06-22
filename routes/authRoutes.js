require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const requirePermission = require("../middleware/requirePermission");
const bcrypt = require("bcryptjs");
const { resolveTenantForLogin, getTenantById, buildInactiveTenantPayload } = require("../services/tenantService");

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;

function buildJwtPayload(user, tenant) {
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    tenant_id: tenant.id,
    tenant_slug: tenant.slug,
  };
}

function buildUserResponse(user, tenant, permissions) {
  return {
    id: user.id,
    nama: user.nama,
    username: user.username,
    role: user.role,
    permissions,
    tenant_id: tenant.id,
    tenant_slug: tenant.slug,
    tenant_nama: tenant.nama,
    tenant_name: tenant.nama,
  };
}

// =====================
// LOGIN
// =====================

router.post("/login", async (req, res) => {
  try {
    const { username, password, tenant_slug } = req.body;

    const tenantResult = await resolveTenantForLogin(tenant_slug);
    if (tenantResult.error) {
      return res.status(tenantResult.status).json({
        success: false,
        error: tenantResult.error,
        message: tenantResult.error,
      });
    }
    const { tenant } = tenantResult;

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = $1
        AND tenant_id = $2
      `,
      [username, tenant.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User tidak ditemukan",
      });
    }

    const user = result.rows[0];

    if (user.role === "platform_superadmin" || user.tenant_id == null) {
      return res.status(403).json({
        success: false,
        error: "Akun platform tidak bisa login melalui portal tenant",
      });
    }

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

    const token = jwt.sign(buildJwtPayload(user, tenant), SECRET_KEY, {
      expiresIn: "7d",
    });

    const permissions = await requirePermission.getPermissionList(user.role, {
      tenantScoped: true,
    });

    res.json({
      success: true,
      token,
      user: buildUserResponse(user, tenant, permissions),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =====================
// VERIFY TOKEN
// =====================

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Token tidak ada",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, SECRET_KEY);

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.nama,
        u.username,
        u.role,
        u.tenant_id,
        t.slug AS tenant_slug,
        t.nama AS tenant_nama
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = $1
      `,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User tidak ditemukan",
      });
    }

    const me = result.rows[0];

    if (me.tenant_id && decoded.tenant_id && me.tenant_id !== decoded.tenant_id) {
      return res.status(401).json({
        success: false,
        error: "Token tenant tidak valid",
      });
    }

    if (me.tenant_id) {
      const tenant = await getTenantById(me.tenant_id);
      if (!tenant) {
        return res.status(403).json({
          success: false,
          error: "Tenant tidak ditemukan",
        });
      }
      if (tenant.status !== "active") {
        return res.status(403).json(buildInactiveTenantPayload());
      }
    }

    const permissions = await requirePermission.getPermissionList(me.role, {
      tenantScoped: Boolean(me.tenant_id),
    });

    res.json({
      success: true,
      user: {
        id: me.id,
        nama: me.nama,
        username: me.username,
        role: me.role,
        permissions,
        tenant_id: me.tenant_id,
        tenant_slug: me.tenant_slug,
        tenant_nama: me.tenant_nama,
        tenant_name: me.tenant_nama,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      success: false,
      error: "Token invalid",
    });
  }
});

// =====================
// REGISTER USER (legacy — assigns default tenant)
// =====================

router.post("/register", async (req, res) => {
  return res.status(403).json({
    success: false,
    error: "Registrasi publik dinonaktifkan. Hubungi admin platform.",
    message: "Registrasi publik dinonaktifkan. Hubungi admin platform.",
  });
});

module.exports = router;
