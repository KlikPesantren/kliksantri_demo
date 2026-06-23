const express = require("express");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const requirePermission = require("../middleware/requirePermission");
const {
  getPlatformSettings,
  updatePlatformSettings,
  EDITABLE_KEYS,
} = require("../services/platformSettingsService");

const router = express.Router();

router.use(platformAuthMiddleware);

router.get(
  "/",
  requirePermission("platform.tenant.view"),
  async (_req, res) => {
    try {
      const data = await getPlatformSettings();
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.patch(
  "/",
  requirePermission("platform.tenant.update"),
  async (req, res) => {
    try {
      const patch = {};
      for (const key of EDITABLE_KEYS) {
        if (req.body?.[key] !== undefined) {
          patch[key] = req.body[key];
        }
      }

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Tidak ada field settings yang dikirim",
        });
      }

      const data = await updatePlatformSettings(patch);
      res.json({ success: true, data });
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
