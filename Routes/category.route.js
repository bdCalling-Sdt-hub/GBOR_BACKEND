const express = require("express");
const router = express.Router();
const categoryController=require("../controllers/category.controller");
const userauthmiddleware=require("../middleware/checkuser.middleware.js");

router.post("/category",userauthmiddleware.checkuser,categoryController.category);
router.get("/category",categoryController.categoryGet);
router.patch("/category/:id",userauthmiddleware.checkuser,categoryController.categoryUpdate);
router.delete("/category/:id",userauthmiddleware.checkuser,categoryController.categoryDelete);

module.exports = router