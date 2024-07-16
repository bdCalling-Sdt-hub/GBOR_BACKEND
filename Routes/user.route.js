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


router.post("/changeexistingpassword",userauthmiddleware.checkuser,userscontroller.changeExistingPassword);
/////////////////////////////////////
router.get("/all-unapproved-user",userauthmiddleware.checkuser,userscontroller.getAllUnapprovedUser)

router.post("/approve-user/:id",userauthmiddleware.checkuser,userscontroller.approveUser)
router.patch("/delete-user/:id",userauthmiddleware.checkuser,userscontroller.deleteUser)
router.patch("/cancel-user/:id",userauthmiddleware.checkuser,userscontroller.cancelUser)

router.get("/content-creator", userscontroller.getAllContentCreator);
router.get("/content-creator/:userName", userscontroller.contentCreator);


router.patch("/profile-update/:id",configureFileUpload(), userscontroller.profileUpdate)

router.get("/search-creator/:name",userscontroller.searchContentCreator)


router.put("/profile-update-by-admin/:id",userauthmiddleware.checkuser,userscontroller.profileUpdateByadmin);

module.exports = router