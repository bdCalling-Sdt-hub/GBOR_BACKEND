const mongoose = require("mongoose")

const policySchema = new mongoose.Schema({
 
    policy: {
        type: String,
        required: true,
        trim:true
    }
    

});

const PolicyModel = mongoose.model("policy", policySchema);
module.exports=PolicyModel