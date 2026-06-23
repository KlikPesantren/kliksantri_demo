const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const requireTenantFeature = require("../middleware/requireTenantFeature");
const controller = require("../controllers/rfidAuditController");

router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  requireTenantFeature("rfid"),
  requirePermission("rfid.view"),
  controller.getAuditLogs
);

module.exports = router;
