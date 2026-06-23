const express = require("express");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const requirePermission = require("../middleware/requirePermission");
const {
  listPlatformAnnouncements,
  getPlatformAnnouncementById,
  createPlatformAnnouncement,
  updatePlatformAnnouncement,
} = require("../services/platformAnnouncementService");

const router = express.Router();

router.use(platformAuthMiddleware);

router.get(
  "/",
  requirePermission("platform.tenant.view"),
  async (req, res) => {
    try {
      const status = req.query.status
        ? String(req.query.status).trim()
        : undefined;
      const items = await listPlatformAnnouncements({ status });
      res.json({ success: true, data: items });
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
      const item = await getPlatformAnnouncementById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: "Pengumuman tidak ditemukan",
        });
      }
      res.json({ success: true, data: item });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post(
  "/",
  requirePermission("platform.tenant.update"),
  async (req, res) => {
    try {
      const item = await createPlatformAnnouncement(req.body || {});
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

router.patch(
  "/:id",
  requirePermission("platform.tenant.update"),
  async (req, res) => {
    try {
      const item = await updatePlatformAnnouncement(req.params.id, req.body || {});
      res.json({ success: true, data: item });
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

module.exports = router;
