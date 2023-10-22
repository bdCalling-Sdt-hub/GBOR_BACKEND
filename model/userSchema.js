const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

    
    fName: {
        type: String,
        required: true,
        trim:true
    },
    lName: {
        type: String,
        required: true,
        trim:true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique:true
    },
    userName: {
        type: String,
        required: true,
        trim:true
    },
    dateOfBirth: {
        type: String,
        required: true,
        trim:true
    },
    password: {
        type: String,
        required: true,
        trim:true
    },
    uploadId: {
        type: String,
        required: true,
        trim:true
    },
    termAndCondition: { type: Boolean, default: false },
    role: { type: String, enum: ['unknown','c_creator', 'admin'], default: 'unknown' },
    emailVerified: { type: Boolean, default: false },
    emailVerifyCode: { type: String, required: false },
    creator_category: { type: String, required: false },

},{ timestamps: true })

const UserModel = mongoose.model("user", userSchema);
module.exports=UserModel