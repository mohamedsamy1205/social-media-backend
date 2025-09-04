const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // صاحب الإشعار
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // اللي عمل الفعل
    type: {
      type: String,
      enum: ["follow", "like", "comment", "message"],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId }, // مثلا PostId أو MessageId
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
