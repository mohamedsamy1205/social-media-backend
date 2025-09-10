const { Server } = require("socket.io");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
const Conversation = require("../models/Ai-Conversation");
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

    // 🟢 AI Chat عبر الـ Socket.IO
    socket.on("chat_message", async ({ conversationId, message }) => {
      try {
        let conversation = null;

        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        }
        if (!conversation) {
          conversation = new Conversation({
            userId: socket.userId,
            messages: []
          });
        }

        // أضف رسالة اليوزر
        conversation.messages.push({ role: "user", content: message });

        // جهز الرسائل للـ OpenAI
        const apiMessages = conversation.messages.map((m) => ({
          role: m.role,
          content: m.content
        }));

        // استدعاء OpenAI API
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL,
            messages: apiMessages,
            max_tokens: 300
          })
        });

        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content ?? "Error";

        // احفظ رد البوت
        conversation.messages.push({ role: "assistant", content: reply });
        await conversation.save();

        // 🔥 ابعت الرد للـ يوزر
        io.to(socket.userId.toString()).emit("chat_reply", {
          conversationId: conversation._id,
          reply
        });
      } catch (err) {
        console.error("AI Chat Error:", err);
        socket.emit("chat_error", { message: "Chat failed" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);
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
