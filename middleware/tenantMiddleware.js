const pool = require("../db");
const { getTenantById, TENANT_INACTIVE_MESSAGE, buildInactiveTenantPayload } = require("../services/tenantService");

/**
 * Enrich request with validated tenant context after authMiddleware.
 * Sets req.tenantId, req.tenantSlug, req.tenant.
 */
async function tenantMiddleware(req, res, next) {
  if (!req.user?.id) {
    return next();
  }

  if (req.user.platform === true || req.user.role === "platform_superadmin") {
    return res.status(403).json({
      success: false,
      error: "Token platform tidak bisa digunakan untuk akses tenant",
    });
  }

  try {
    let tenantId = req.user.tenant_id ?? req.tenantId ?? null;

    if (!tenantId) {
      const { rows } = await pool.query(
        `SELECT tenant_id FROM users WHERE id = $1`,
        [req.user.id]
      );
      tenantId = rows[0]?.tenant_id ?? null;
    }

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: "Tenant context tidak tersedia",
      });
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return res.status(403).json({
        success: false,
        error: "Tenant tidak ditemukan",
      });
    }

    if (tenant.status !== "active") {
      return res.status(403).json(buildInactiveTenantPayload());
    }

    req.tenantId = tenant.id;
    req.tenantSlug = tenant.slug;
    req.tenant = tenant;
    req.user.tenant_id = tenant.id;
    req.user.tenant_slug = tenant.slug;

    next();
  } catch (err) {
    console.error("[tenantMiddleware]", err);
    return res.status(500).json({
      success: false,
      error: "Gagal memuat tenant context",
    });
  }
}

module.exports = tenantMiddleware;
