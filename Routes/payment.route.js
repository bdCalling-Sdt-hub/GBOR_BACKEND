const express = require("express");
const router = express.Router();
const {addPayment, getAllPayments} = require("../controllers/payment.controller")
const userauthmiddleware=require("../middleware/checkuser.middleware.js");

router.post('/', addPayment);
router.get('/', userauthmiddleware.checkuser,getAllPayments);

module.exports = router