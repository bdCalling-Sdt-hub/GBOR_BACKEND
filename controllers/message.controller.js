const mongoose = require("mongoose");
const Message = require('../model/messageSchema');

exports.addMessage = async (messageInfo, receiverId) => {
  try {
    const newMessage = new Message(messageInfo);
    const countUnseen = await Message.countDocuments({ sender: newMessage.sender, chat: newMessage.chat, isViewed: false })
    io.to('room' + receiverId).emit('message-count', countUnseen)
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
    return message;
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.getMessageByChatId = async (chatId, id) => {
  try {
    await Message.updateMany({ chat: chatId, sender: { $ne: id } }, { $set: { isViewed: true } })
    const message = await Message.find({ chat: chatId })
      .populate('sender', 'name image createdAt');
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
    console.log(error)
  }
}

exports.getUnseenMessageCount = async (id, chatId) => {
  try {
    const message = await Message.find({ sender: { $ne: id }, chat: chatId, isViewed: false })
    return message.length
  } catch (error) {
    console.log(error)
  }
}

exports.deleteMessageById = async (id) => {
  try {
    const message = await Message.findByIdAndDelete(id)
    console.log(message)
    return message
  } catch (error) {
    console.log(error)
  }
}

exports.addMutipleMessage = async (messageInfo) => {
  try {
    console.log('multiple message called-------->', messageInfo)
    await Message.insertMany(messageInfo);
  } catch (err) {
    console.error(err);
    return null;
  }
};
