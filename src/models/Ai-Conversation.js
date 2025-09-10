const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null => assistant/system
  role: { type: String, enum: ['system','user','assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  title: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // اللي عمل الشات
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // للـ multi-user
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

conversationSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
