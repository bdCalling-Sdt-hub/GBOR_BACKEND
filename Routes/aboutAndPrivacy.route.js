const express = require("express");
const router = express.Router();
const userauthmiddleware=require("../middleware/checkuser.middleware");
const {aboutUs,privacy,termAndCondition, aboutUsFetch, termAndConditionFetch, privacyFetch}=require("../controllers/aboutAndPrivacy.controller");



router.post("/aboutus",userauthmiddleware.checkuser,aboutUs);
router.get("/aboutus",userauthmiddleware.checkuser,aboutUsFetch);

router.post("/term-and-condition",userauthmiddleware.checkuser,termAndCondition);
router.get("/term-and-condition",userauthmiddleware.checkuser,termAndConditionFetch);
router.post("/privacy-policy",userauthmiddleware.checkuser,privacy);
router.get("/privacy-policy",userauthmiddleware.checkuser,privacyFetch);
module.exports = router