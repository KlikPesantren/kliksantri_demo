const express = require("express");
const {
  getTenantBySlug,
  TENANT_INACTIVE_MESSAGE,
} = require("../services/tenantService");

const router = express.Router();
const { resolveActiveTenantByHostname } = require("../services/customTenantDomainService");

router.get("/resolve-domain/by-hostname", async (req, res) => {
  try {
    const domain = await resolveActiveTenantByHostname(req.query.hostname || req.headers["x-tenant-hostname"]);
    if (!domain) return res.status(404).json({ success: false, error: "Portal pesantren tidak ditemukan" });
    return res.json({ success: true, data: {
      hostname: domain.hostname, tenant_slug: domain.slug, nama: domain.nama,
      logo_url: domain.logo_url || null, tagline: domain.tagline || null,
      alamat: domain.alamat || null, telepon: domain.telepon || null,
      status: domain.status, service_available: true,
    } });
  } catch {
    return res.status(500).json({ success: false, error: "Gagal memuat portal pesantren" });
  }
});

router.get("/:slug/profile", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const tenant = await getTenantBySlug(slug);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Pesantren tidak ditemukan",
      });
    }

    const serviceAvailable = tenant.status === "active";

    res.json({
      success: true,
      data: {
        slug: tenant.slug,
        nama: tenant.nama,
        logo_url: tenant.logo_url || null,
        tagline: tenant.tagline || null,
        alamat: tenant.alamat || null,
        telepon: tenant.telepon || null,
        status: tenant.status,
        service_available: serviceAvailable,
        message: serviceAvailable ? null : TENANT_INACTIVE_MESSAGE,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
