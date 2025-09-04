const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  // Profile Info
  fullName: { type: String, required: true },
  bio: { type: String, maxlength: 200 }, // وصف قصير
  gender: { type: String, enum: ["male", "female", "other"] },
  dateOfBirth: { type: Date },
  profileImage: { type: String, default: "default-profile.png" },
  coverImage: { type: String, default: "default-cover.png" },

  // Social features
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // // Notifications
  // notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],

  // Settings
  isPrivate: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });

// Virtuals for counts
userSchema.virtual("followersCount").get(function () {
  return this.followers.length;
});

userSchema.virtual("followingCount").get(function () {
  return this.following.length;
});

module.exports = mongoose.model("User", userSchema);
