const express = require("express");
const pool = require("../db");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const requirePermission = require("../middleware/requirePermission");
const { createTenantWithDefaults } = require("../services/tenantOnboardingService");
const { getTenantById } = require("../services/tenantService");
const { getTenantPlatformDashboard } = require("../services/tenantPlatformStatsService");

const router = express.Router();

router.use(platformAuthMiddleware);

router.get(
  "/",
  requirePermission("platform.tenant.view"),
  async (req, res) => {
    try {
      const status = req.query.status
        ? String(req.query.status).trim()
        : null;
      const q = req.query.q ? String(req.query.q).trim() : null;

      const conditions = [];
      const params = [];
      let i = 1;

      if (status) {
        conditions.push(`t.status = $${i}`);
        params.push(status);
        i += 1;
      }

      if (q) {
        conditions.push(`(t.nama ILIKE $${i} OR t.slug ILIKE $${i})`);
        params.push(`%${q}%`);
        i += 1;
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const result = await pool.query(
        `SELECT
           t.id, t.slug, t.nama, t.status, t.alamat, t.telepon, t.logo_url,
           t.tagline, t.onboarded_at, t.suspended_at, t.suspended_reason,
           t.created_at,
           (SELECT COUNT(*)::int FROM users u WHERE u.tenant_id = t.id) AS user_count,
           (SELECT COUNT(*)::int FROM unit_pendidikan up WHERE up.tenant_id = t.id) AS unit_count
         FROM tenants t
         ${where}
         ORDER BY t.onboarded_at DESC NULLS LAST, t.id DESC`,
        params
      );

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post(
  "/",
  requirePermission("platform.tenant.create"),
  async (req, res) => {
    try {
      const result = await createTenantWithDefaults(
        req.body,
        req.platformUser
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

router.get(
  "/:id/dashboard",
  requirePermission("platform.tenant.view"),
  async (req, res) => {
    try {
      const dashboard = await getTenantPlatformDashboard(req.params.id);
      if (!dashboard) {
        return res.status(404).json({
          success: false,
          error: "Tenant tidak ditemukan",
        });
      }

      res.json(dashboard);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  "/:id",
  requirePermission("platform.tenant.view"),
  async (req, res) => {
    try {
      const tenant = await getTenantById(req.params.id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: "Tenant tidak ditemukan",
        });
      }

      const counts = await pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM users WHERE tenant_id = $1) AS user_count,
           (SELECT COUNT(*)::int FROM unit_pendidikan WHERE tenant_id = $1) AS unit_count`,
        [tenant.id]
      );

      const profil = await pool.query(
        `SELECT id, nama_pesantren, alamat, telepon, logo_url
         FROM profil_pesantren
         WHERE tenant_id = $1
         LIMIT 1`,
        [tenant.id]
      );

      res.json({
        success: true,
        data: {
          ...tenant,
          user_count: counts.rows[0].user_count,
          unit_count: counts.rows[0].unit_count,
          profil: profil.rows[0] || null,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.patch(
  "/:id/status",
  requirePermission("platform.tenant.suspend"),
  async (req, res) => {
    try {
      const { status, reason } = req.body;
      const allowed = new Set(["active", "suspended", "inactive"]);

      if (!allowed.has(status)) {
        return res.status(400).json({
          success: false,
          error: "Status harus active, suspended, atau inactive",
        });
      }

      const suspendedAt =
        status === "active" ? null : new Date();
      const suspendedReason =
        status === "active" ? null : reason?.trim() || null;

      const result = await pool.query(
        `UPDATE tenants
         SET status = $1,
             suspended_at = $2,
             suspended_reason = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, suspendedAt, suspendedReason, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant tidak ditemukan",
        });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.patch(
  "/:id",
  requirePermission("platform.tenant.update"),
  async (req, res) => {
    try {
      const { nama, alamat, telepon, logo_url, tagline } = req.body;

      const result = await pool.query(
        `UPDATE tenants
         SET
           nama = COALESCE($1, nama),
           alamat = COALESCE($2, alamat),
           telepon = COALESCE($3, telepon),
           logo_url = COALESCE($4, logo_url),
           tagline = COALESCE($5, tagline),
           updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          nama?.trim() || null,
          alamat?.trim() || null,
          telepon?.trim() || null,
          logo_url ?? null,
          tagline?.trim() || null,
          req.params.id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Tenant tidak ditemukan",
        });
      }

      const tenant = result.rows[0];

      if (nama || alamat || telepon || logo_url !== undefined) {
        await pool.query(
          `UPDATE profil_pesantren
           SET
             nama_pesantren = COALESCE($1, nama_pesantren),
             alamat = COALESCE($2, alamat),
             telepon = COALESCE($3, telepon),
             logo_url = COALESCE($4, logo_url),
             updated_at = NOW()
           WHERE tenant_id = $5`,
          [
            nama?.trim() || null,
            alamat?.trim() || null,
            telepon?.trim() || null,
            logo_url ?? null,
            tenant.id,
          ]
        );
      }

      res.json({ success: true, data: tenant });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
