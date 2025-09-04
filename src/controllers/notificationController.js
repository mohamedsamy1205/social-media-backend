const Notification = require("../models/Notification");

// ➕ إنشاء إشعار جديد
const createNotification = async (receiver, sender, type, entityId = null) => {
  const notification = new Notification({
    receiver,
    sender,
    type,
    entityId,
  });
  await notification.save();
  return notification;
};

// 📩 جلب إشعارات يوزر
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id })
      .populate("sender", "username profilePic")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ مارك كـ مقروء
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if (notification.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Marked as read", notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createNotification, getNotifications, markAsRead };
