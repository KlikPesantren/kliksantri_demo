const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const deviceAuthMiddleware = require("../middleware/deviceAuthMiddleware");
const deviceController = require("../controllers/rfidDeviceController");

const adminDevice = [
  authMiddleware,
  tenantMiddleware,
  requirePermission.requireAnyPermission(["device.view", "rfid.view", "device.manage", "rfid.manage"]),
];

// Admin provision + list
router.post(
  "/provision",
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.manage"),
  deviceController.provision
);

router.get("/", ...adminDevice, deviceController.list);

// Device-authenticated routes (tenant from device credentials)
router.post("/register", deviceController.register);
router.put(
  "/assign",
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.manage"),
  deviceController.assignMerchant
);
router.post("/heartbeat", deviceAuthMiddleware, deviceController.heartbeat);

module.exports = router;
