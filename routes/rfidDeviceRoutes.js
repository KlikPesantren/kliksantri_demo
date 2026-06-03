const express =
require("express");

const router =
express.Router();

const deviceController =
require(
"../controllers/rfidDeviceController"
);

router.post(
  "/register",
  deviceController.register
);

router.put(
  "/assign",
  deviceController.assignMerchant
);

router.post(
  "/heartbeat",
  deviceController.heartbeat
);

module.exports =
router;