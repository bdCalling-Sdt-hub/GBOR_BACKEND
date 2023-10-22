const express = require("express");
const router = express.Router();

const {contact}=require("../controllers/emailSend.controller");

router.post("/email-send",contact);

module.exports = router