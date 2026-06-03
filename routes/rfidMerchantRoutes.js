const express =
require("express");

const router =
express.Router();

const merchantController =
require(
"../controllers/rfidMerchantController"
);

router.get(
  "/",
  merchantController.getAll
);

router.post(
  "/",
  merchantController.create
);

router.put(
  "/:id",
  merchantController.update
);

router.delete(
  "/:id",
  merchantController.remove
);

module.exports =
router;