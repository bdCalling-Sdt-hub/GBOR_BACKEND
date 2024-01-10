const express = require("express");
const router = express.Router();
const {addPayment, getAllPayments, getPreviousDonors, exceptMessageView, getAllDonorList} = require("../controllers/payment.controller")
const userauthmiddleware=require("../middleware/checkuser.middleware.js");

router.post('/', addPayment);
router.get('/:username', getPreviousDonors);
router.get('/donor-list/:id',userauthmiddleware.checkuser,getAllDonorList);
router.get('/', userauthmiddleware.checkuser,getAllPayments);
router.patch('/:id', userauthmiddleware.checkuser,exceptMessageView);

module.exports = router