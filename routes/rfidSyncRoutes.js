const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const deviceAuthMiddleware = require("../middleware/deviceAuthMiddleware");
const syncController = require("../controllers/rfidSyncController");

router.post("/", deviceAuthMiddleware, syncController.syncTransactions);

module.exports = router;
