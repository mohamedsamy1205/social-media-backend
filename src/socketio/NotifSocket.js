const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // في البروداكشن تخليها الدومين بتاع الفرونت
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // المستخدم بينضم بروم باسمه (userId)
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

// 🟢 فانكشن لإرسال إشعار لمستخدم محدد
const sendNotification = (receiverId, notification) => {
  if (io) {
    io.to(receiverId.toString()).emit("notification", notification);
  }
};

module.exports = { initSocket, sendNotification };
