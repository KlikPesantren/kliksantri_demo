const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const requireTenantFeature = require("../middleware/requireTenantFeature");
const deviceAuthMiddleware = require("../middleware/deviceAuthMiddleware");
const syncController = require("../controllers/rfidSyncController");

router.post("/", deviceAuthMiddleware, requireTenantFeature("rfid"), syncController.syncTransactions);

module.exports = router;
