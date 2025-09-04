const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getMyProfile, getUserProfile, updateProfile, deleteAccount } = require("../controllers/userController");
const { followUser, unfollowUser, getFollowers, getFollowing } = require("../controllers/userController");

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile); // البروفايل بتاعي
router.get("/:id", authMiddleware, getUserProfile); // أي يوزر تاني
router.put("/me", authMiddleware, updateProfile); // تحديث بياناتي
router.delete("/me", authMiddleware, deleteAccount); // مسح الأكونت

// Follow & Unfollow
router.post("/:id/follow", authMiddleware, followUser);
router.post("/:id/unfollow", authMiddleware, unfollowUser);

// Followers & Following Lists
router.get("/:id/followers", authMiddleware, getFollowers);
router.get("/:id/following", authMiddleware, getFollowing);


module.exports = router;
