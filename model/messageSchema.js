const mongoose = require('mongoose')
const messageModel = mongoose.Schema(
  {
    message: {
      type: String,
      trim: true
    },
    chat:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'chat'
    },
    sender:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'user'
    },
  },{
    timestamps: true
  }
);
const Message = mongoose.model('message', messageModel);
module.exports = Message
