const express =
require("express");

const router =
express.Router();

const rfidController =
require("../controllers/rfidController");

// ======================
// DASHBOARD
// ======================

router.get(
  "/dashboard",
  rfidController.getDashboard
);

// ======================
// RFID PAYMENT
// ======================

router.post(
  "/payment",
  rfidController.rfidPayment
);

// ======================
// TRANSAKSI RFID
// ======================

router.get(
  "/transactions",
  rfidController.getTransactions
);

router.get(
  "/transactions/export",
  rfidController.exportTransactions
);

// ======================
// TOPUP
// ======================
router.post(
  "/topup",
  rfidController.topupSaldo
);

router.get(
  "/topup/export",
  rfidController.exportTopup
);

router.post(
  "/refund",
  rfidController.refundTransaction
);

router.get(
  "/mutasi",
  rfidController.getMutasi
);

module.exports =
router;