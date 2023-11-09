const mongoose = require("mongoose");
const Message = require('../model/messageSchema');
const { getChatById } = require("./chat.controller");

exports.addMessage = async (messageInfo) => {
  //console.log('------------add message hitted----------')
  try {
    const newMessage = new Message(messageInfo);
    await newMessage.save();
    return newMessage;
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.getById = async (id) => {
  try {
    const message = await Message.findById(id);
    //console.log(id, message)
    return message;
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.getMessageByChatId = async (id) => {
  try {
    const message = await Message.find({ chat: id }).populate('sender', 'role uploadId lName fName');
    //console.log(id, message)
    return message;
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.updateMessageById = async (id, document, options) => {
  try {
    const message = await Message.findByIdAndUpdate(id, document, options)
    return message
  } catch (error) {
    //console.log(error)
  }
}
exports.deleteMessageById = async (id) => {
  try {
    const message = await Message.findByIdAndDelete(id)
    //console.log(message)
    return message
  } catch (error) {
    //console.log(error)
  }
}

exports.addMultipleMessages = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(401).json({ status: 401, message: 'You are not authorised to send all message' })
    }
    const messageInfo = req.body
    console.log(typeof messageInfo)
    const messages = await Message.insertMany(messageInfo);
    console.log(messages.length)
    ////console.log('insert many message', messages)
    if (messages?.length > 0) {
      io.emit('multiple-message-hitted', 'check all message')
      console.log(messages.length)
      for (let message of messages) {
        // const chatInfo = await getChatById(message.chat)
        // console.log('id', message.chat)
        // console.log('new multiple message notification going ------> ', chatInfo)
        const appearedData = {
          sender: message.sender,
          chat: message.chat
        }
        io.emit('creator-message-appeared', appearedData)
      }
      return res.status(200).json({ status: 200, message: "Send all message successfull"})
    }
    else {
      return res.status(200).json({ status: 200, message: "No chat exists" })
    }
  }
  catch (error) {
    return res.status(500).json({ status: 500, message: error.message })
  }
}
// exports.addMutipleMessage = async (messageInfo) => {
//   try {
//     //console.log('multiple message called-------->', messageInfo)
//     const messages = await Message.insertMany(messageInfo);
//     //console.log('multiple message added-------->', messages)

//   } catch (err) {
//     console.error(err);
//     return null;
//   }
// };