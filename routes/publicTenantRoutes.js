const express = require("express");
const {
  getTenantBySlug,
  TENANT_INACTIVE_MESSAGE,
} = require("../services/tenantService");

const router = express.Router();

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
