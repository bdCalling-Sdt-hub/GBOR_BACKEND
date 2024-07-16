const express = require("express");
const router = express.Router();
const {
  addPayment,
  getAllPayments,
  getPreviousDonors,
  exceptMessageView,
  getAllDonorList,
  reportMessageToAdmin,
  getAllComments,
  getSingleCreatorComments,
} = require("../controllers/payment.controller");


const userauthmiddleware = require("../middleware/checkuser.middleware.js");
router.get("/comments", userauthmiddleware.checkuser, getAllComments);
router.get("/donor-list/:id", userauthmiddleware.checkuser, getAllDonorList);
router.get("/message-list/:id", userauthmiddleware.checkuser,getSingleCreatorComments);
router.get("/:username", getPreviousDonors);
router.patch("/report/:id", userauthmiddleware.checkuser, reportMessageToAdmin);
router.patch("/:id", userauthmiddleware.checkuser, exceptMessageView);
router.get("/", userauthmiddleware.checkuser, getAllPayments);
router.post("/", addPayment);

module.exports = router;
