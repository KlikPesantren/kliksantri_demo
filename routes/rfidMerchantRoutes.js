const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const merchantController = require("../controllers/rfidMerchantController");

const adminRfid = [
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.view"),
];

router.get("/", ...adminRfid, merchantController.getAll);
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.manage"),
  merchantController.create
);
router.put(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.manage"),
  merchantController.update
);
router.delete(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.manage"),
  merchantController.remove
);

module.exports = router;
