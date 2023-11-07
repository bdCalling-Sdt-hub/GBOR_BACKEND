const Chat = require("../model/chatSchema");

exports.addChat = async (chatInfo) => {
  try {
    console.log(chatInfo.participants)
    const existingChat = await Chat.findOne({ participants: chatInfo.participants });

    if (existingChat) {
      return existingChat;
    } else {
      const newChat = await Chat.create({ participants: chatInfo.participants });
      return newChat;
    }
  } catch (error) {
    console.log(error)
    return null;
  }
}
exports.getChatById = async (id) => {
  try {
    const chat = await Chat.findById(id).populate('participants', 'role uploadId lName fName');
    console.log('chat Id: ', id)
    if (chat) {
      return chat;
    }
    else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.getChatByParticipantId = async (id) => {
  try {
    const chat = await Chat.find({ participants: id })
      .populate('participants', 'role uploadId lName fName')
    console.log(id, chat)
    if (chat.length > 0) {
      return chat;
    }
    else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};
exports.deleteChatById = async (id) => {
  try {
    const chat = await Chat.findByIdAndDelete(id);
    if (chat) {
      return chat;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error)
  }
}