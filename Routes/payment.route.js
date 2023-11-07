const express = require("express");
const router = express.Router();
const {addPayment, getAllPayments, getPreviousDonors, exceptMessageView} = require("../controllers/payment.controller")
const userauthmiddleware=require("../middleware/checkuser.middleware.js");

router.post('/', addPayment);
router.get('/:id', getPreviousDonors);
router.get('/', userauthmiddleware.checkuser,getAllPayments);
router.patch('/:id', userauthmiddleware.checkuser,exceptMessageView);

module.exports = router