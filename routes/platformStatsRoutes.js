const express = require("express");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const requirePermission = require("../middleware/requirePermission");
const { getPlatformStatsSummary } = require("../services/platformStatsService");

const router = express.Router();

router.use(platformAuthMiddleware);

router.get(
  "/summary",
  requirePermission("platform.tenant.view"),
  async (req, res) => {
    try {
      const summary = await getPlatformStatsSummary();
      res.json(summary);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
