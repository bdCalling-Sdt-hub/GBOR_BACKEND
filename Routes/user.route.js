const express = require("express");
const router = express.Router();
const userscontroller = require("../controllers/user.controller.js")
const userauthmiddleware=require("../middleware/checkuser.middleware.js");
const configureFileUpload=require("../middleware/fileUpload.middleware.js")
//route level middleware
router.use("/changepassword", userauthmiddleware.checkuser)
router.use("/loggeduser", userauthmiddleware.checkuser)


router.post("/register",configureFileUpload(),userscontroller.userRegister)
router.post("/verifyemail",userauthmiddleware.checkuser,userscontroller.verifyEmail)
router.post("/login", userscontroller.userLogin)

router.post("/changepassword",userscontroller.changeuserpassword)
router.get("/loggeduser", userscontroller.loggeduserdata)

router.post("/send-reset-password-email", userscontroller.senduserpasswordresetemail)
router.post("/verify-code-reset-password", userscontroller.verifyCodeForResetPassword)
router.post("/reset-password",userscontroller.resetpassword)
router.get("/all-unapproved-user", userscontroller.getAllUnapprovedUser)
router.post("/approve-user", userscontroller.approveUser)


router.get("/content-creator", userscontroller.getAllContentCreator)
module.exports = router