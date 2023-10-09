const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
  }],
},
  {
    timestamps: true
  }
);

const ChatModel = mongoose.model("chat", chatSchema);
module.exports=ChatModel