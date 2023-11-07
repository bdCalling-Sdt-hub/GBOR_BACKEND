const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const userauthmiddleware = require("../middleware/checkuser.middleware.js");

router.post("/multiple-messages", userauthmiddleware.checkuser, messageController.addMultipleMessages);

module.exports = router