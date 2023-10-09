const mongoose = require("mongoose")

const termAndConditionSchema = new mongoose.Schema({
 
    
    termAndCondition: {
        type: String,
        required: true,
        trim:true
    }
    

});

const TermAndConditionModel = mongoose.model("termandcondition", termAndConditionSchema);
module.exports=TermAndConditionModel