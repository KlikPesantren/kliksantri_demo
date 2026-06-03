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

module.exports =
router;