const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const deviceAuthMiddleware = require("../middleware/deviceAuthMiddleware");
const rfidController = require("../controllers/rfidController");

const adminRfidView = [
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.view"),
];

const adminRfidManage = [
  authMiddleware,
  tenantMiddleware,
  requirePermission("rfid.manage"),
];

router.get("/dashboard", ...adminRfidView, rfidController.getDashboard);

router.post("/payment", deviceAuthMiddleware, rfidController.rfidPayment);

router.get("/transactions", ...adminRfidView, rfidController.getTransactions);
router.get("/transactions/export", ...adminRfidView, rfidController.exportTransactions);

router.post("/topup", ...adminRfidManage, rfidController.topupSaldo);
router.get("/topup/export", ...adminRfidView, rfidController.exportTopup);
router.post("/refund", ...adminRfidManage, rfidController.refundTransaction);
router.get("/mutasi", ...adminRfidView, rfidController.getMutasi);

module.exports = router;
