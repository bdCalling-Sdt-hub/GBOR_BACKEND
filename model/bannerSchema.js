const mongoose = require("mongoose")

const bannerSchema = new mongoose.Schema({
 
    bannerImage: {
        type: String,
        required:[true, "banner image must be required"],
        trim: true,
       
    }

});

const BannerModel = mongoose.model("banner", bannerSchema);
module.exports=BannerModel