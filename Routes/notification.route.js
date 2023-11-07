const express = require("express");
const router = express.Router();
const { getNotificationDetails, allNotifications } = require("../controllers/notification.controller.js")
const userauthmiddleware = require("../middleware/checkuser.middleware.js");

router.get('/notifications', userauthmiddleware.checkuser, allNotifications);
router.patch('/notifications/:id', userauthmiddleware.checkuser, getNotificationDetails);
module.exports = router