const express = require("express");

const router = express.Router();

const controller =
require("../controllers/rfidMonitorController");

router.get(
  "/",
  controller.getMonitor
);

module.exports = router;