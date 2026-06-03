const express =
require("express");

const router =
express.Router();

const syncController =
require(
"../controllers/rfidSyncController"
);

router.post(
  "/",
  syncController.syncTransactions
);

module.exports =
router;