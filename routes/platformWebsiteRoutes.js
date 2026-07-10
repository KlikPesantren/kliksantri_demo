const express = require("express");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const {
  getPublishedWebsiteContent,
  getWebsiteSettingsForPlatform,
  publishWebsiteContent,
  updateWebsiteDraft,
} = require("../services/platformWebsiteService");

const platformRouter = express.Router();
const publicRouter = express.Router();

publicRouter.get("/content", async (_req, res) => {
  try {
    const data = await getPublishedWebsiteContent();
    res.json({
      success: true,
      data: data.content,
      updated_at: data.updated_at,
      published_at: data.published_at,
    });
  } catch (err) {
    console.error("[publicWebsiteContent]", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

platformRouter.use(platformAuthMiddleware);

platformRouter.get("/content", async (_req, res) => {
  try {
    const data = await getWebsiteSettingsForPlatform();
    res.json({ success: true, data });
  } catch (err) {
    console.error("[platformWebsiteContent]", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

platformRouter.put("/content", async (req, res) => {
  try {
    const data = await updateWebsiteDraft(
      req.body?.content,
      req.platformUser?.id
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error("[platformWebsiteUpdate]", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
    });
  }
});

platformRouter.post("/publish", async (req, res) => {
  try {
    const data = await publishWebsiteContent(req.platformUser?.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("[platformWebsitePublish]", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = {
  platformWebsiteRoutes: platformRouter,
  publicWebsiteRoutes: publicRouter,
};
