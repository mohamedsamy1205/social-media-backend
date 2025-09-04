const User = require("../models/User");
const bcrypt = require("bcrypt");
const { createNotification } = require("./notificationController");
const { sendNotification } = require("../socketio/NotifSocket");

// 🟢 Get My Profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get Any User Profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Update My Profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, fullName, bio, gender, dateOfBirth, profileImage, coverImage, password } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (bio) updateData.bio = bio;
    if (gender) updateData.gender = gender;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (profileImage) updateData.profileImage = profileImage;
    if (coverImage) updateData.coverImage = coverImage;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🟢 Delete My Account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Follow User
exports.followUser = async (req, res) => {
  try {
    const userId = req.user.id; // اليوزر اللي داخل
    const targetId = req.params.id; // اليوزر اللي عايزين نتابعه

    if (userId === targetId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (user.following.includes(targetId)) {
      return res.status(400).json({ message: "You already follow this user" });
    }

    user.following.push(targetId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();
    const notification = await createNotification(targetId, userId, "follow");
    sendNotification(targetId, notification);

    res.json({ message: `You are now following ${targetUser.username}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Unfollow User
exports.unfollowUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (!user.following.includes(targetId)) {
      return res.status(400).json({ message: "You are not following this user" });
    }

    user.following = user.following.filter(id => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

    await user.save();
    await targetUser.save();

    res.json({ message: `You unfollowed ${targetUser.username}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get Followers
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("followers", "username fullName profileImage");
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get Following
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("following", "username fullName profileImage");
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

