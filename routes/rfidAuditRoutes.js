const express =
require("express");

const router =
express.Router();

const controller =
require(
"../controllers/rfidAuditController"
);

router.get(
  "/",
  controller.getAuditLogs
);

module.exports =
router;