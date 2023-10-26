const { addChat, getChatByParticipantId } = require("../controllers/chat.controller");
const { addMessage, getMessageByChatId, addMutipleMessage } = require("../controllers/message.controller");
const { getAllNotification, updateAndGetNotificationDetails } = require("../controllers/notification.controller");

const socketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`ID: ${socket.id} just connected`);
    socket.on('join-room', (data) => {
      console.log('join room request sent----------->', data.uid);
      socket.join('room' + data.uid);
      io.to('room' + data.uid).emit('join-check', 'You are in room: ' + data.uid);
    });

    socket.on('leave-room', (data) => {
      if (data?.uid) {
        socket.leave('room' + data.uid);
      }
    });

    socket.on("join-chat", async (data) => {
      socket.join('room' + data?.uid)
      console.log("join-chat info---->", data)
      const allChats = await getMessageByChatId(data?.uid)
      io.to("room" + data.uid).emit('all-messages', allChats)
    })
    socket.on('add-new-chat', async (data) => {
      if (data?.chatInfo) {
        const chat = await addChat(data.chatInfo)
        console.log('--------> new chat to be added', chat)
        socket.join('room' + data.uid)
        io.to('room' + data.uid).emit('chat-id-check', chat)
      }
      else if (data?.uid) {
        io.to('room' + data.uid).emit('chat-id-check', null)
      }
    })
    socket.on('add-new-message', async (data) => {
      var message
      if (data) {
        message = await addMessage(data)
      }
      else {
        if (data.uid) {
          io.to('room' + data.uid).emit('all-messages', [])
        }
      }
      console.log('--------> new message to be added', message)
      const allMessages = await getMessageByChatId(message?.chat)
      io.to('room' + message.chat).emit('all-messages', allMessages)
    })
    socket.on('get-all-chats', async (data) => {
      const allChats = await getChatByParticipantId(data.uid)
      socket.join('room' + data.uid)
      //console.log('hitting from socket -------->', allChats)
      io.to('room' + data.uid).emit('all-chats', allChats)
    })
    socket.on('add-multiple-messages', async (data) => {
      const messages = await addMutipleMessage(data)
      console.log('--------> new message to be added', messages)
      if (messages?.length > 0) {
        io.emit('multiple-message-answer', 'all message send successfully')
      }
    })
    socket.on('give-notification', async (data) => {
      if (data.role === 'admin') {
        const allNotification = await getAllNotification('admin')
        console.log('admin-wants-notification-------------->', allNotification)
        socket.emit('admin-notification', allNotification)
      }
    })
    socket.on('update-notification', async (data) => {
      await updateAndGetNotificationDetails(data.userId, data.notificationId)
    })

    socket.on('disconnect', () => {
      console.log(`ID: ${socket.id} disconnected`);
    });
  });
};

module.exports = socketIO;