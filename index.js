const express = require("express");
const cors = require("cors")
require("dotenv").config();
const port = process.env.PORT || 5001
const app = express()
const userRoute = require("./Routes/user.route")
const dbconection = require("./config/dbconection")
const aboutAndPrivacyRoute = require("./Routes/aboutAndPrivacy.route")
const bannerRoute = require("./Routes/banner.route")
const emailSendRoute = require("./Routes/emailSend.route")
const notificationRoute = require("./Routes/notification.route")
const messageRoute = require("./Routes/message.route")
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const dburl = process.env.DB_URL

dbconection(dburl)
//initilizing socketIO
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*"
  }
});

const socketIO = require("./helpers/socketIO");
socketIO(io);

global.io = io

const socketIOPort = process.env.SOCKET_IO_PORT
server.listen(socketIOPort, '192.168.10.13', () => {
  console.log(`Socket is listening on port: ${socketIOPort}`);
});

app.use("/api/auth/", userRoute);
app.use("/api/", aboutAndPrivacyRoute)
app.use("/api/", bannerRoute)
app.use("/api/", notificationRoute)
app.use("/api/", emailSendRoute)
app.use('/api/messages', messageRoute)


app.use('/upload/image', express.static(__dirname + '/upload/image/'));


app.use((err, req, res, next) => {
  //console.error("error tushar",err.message);
  res.status(500).json({ message: err.message });
});

app.listen(port, "192.168.10.13", () => {
  console.log(`server running in ${port}`)
  console.log("ok all right everything")
})