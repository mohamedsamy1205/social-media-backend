const express = require('express');
const router = express.Router();
const {
  toggleLike,
  getLikes,
  checkUserLike,
  getUserLikedPosts,
  getRecentLikes,
  getLikeStats
} = require('../controllers/likeController');

//middleware 
const authMiddleware  = require('../middleware/authMiddleware');
const { validateLike, validateLikeParams } = require('../middleware/validation');


//  Like or unlike a post/comment
router.post('/', authMiddleware, validateLike, toggleLike);

//Get all likes for a post or comment
router.get('/:targetType/:targetId', validateLikeParams, getLikes);

//Check if current user liked a post/comment
router.get('/check/:targetType/:targetId', authMiddleware, checkUserLike);

//Get current user's liked posts
router.get('/user/posts', authMiddleware, getUserLikedPosts);

//Get recent likes on user's posts (for notifications)
router.get('/notifications', authMiddleware, getRecentLikes);

// Get like statistics for current user
router.get('/stats', authMiddleware, getLikeStats);

module.exports = router;