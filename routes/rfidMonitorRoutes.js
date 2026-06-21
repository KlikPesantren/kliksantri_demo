const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const controller = require("../controllers/rfidMonitorController");

router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.view"),
  controller.getMonitor
);

module.exports = router;
