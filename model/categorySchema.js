const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
 
    categoryName: {
        type: String,
        trim: true,
    }



});

const CategoryModel = mongoose.model("category", categorySchema);
module.exports=CategoryModel