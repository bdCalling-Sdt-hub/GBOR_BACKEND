const express = require("express");
const router = express.Router();
const bannerController=require("../controllers/banner.controller");
const configureFileUpload=require("../middleware/fileUpload.middleware")
const userauthmiddleware=require("../middleware/checkuser.middleware.js");

router.post("/banner",userauthmiddleware.checkuser,configureFileUpload(),bannerController.banner);
router.get("/banner",userauthmiddleware.checkuser,bannerController.bannerDataGet);
router.delete("/banner/:id",userauthmiddleware.checkuser,bannerController.bannerDelete);

module.exports = router