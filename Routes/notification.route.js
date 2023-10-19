const express = require("express");
const router = express.Router();
const {getNotificationDetails, allNotifications} = require("../controllers/notification.controller.js")
const userauthmiddleware=require("../middleware/checkuser.middleware.js");

router.get('/', userauthmiddleware.checkuser, allNotifications);
router.patch('/:id', userauthmiddleware.checkuser, getNotificationDetails);
module.exports = router