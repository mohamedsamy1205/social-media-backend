// controllers/likeController.js
const Like = require('../models/Like');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// Like or unlike a post/comment
const toggleLike = async (req, res) => {
  try {
    const { targetId, targetType } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!targetId || !targetType) {
      return res.status(400).json({
        success: false,
        message: 'Target ID and target type are required'
      });
    }

    if (!['post', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Target type must be either "post" or "comment"'
      });
    }

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target ID format'
      });
    }

    // Check if target exists
    let target;
    if (targetType === 'post') {
      target = await Post.findById(targetId);
    } else {
      target = await Comment.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found`
      });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId,
      targetId,
      targetType
    });

    let isLiked;
    let message;

    if (existingLike) {
      // Unlike - remove the like
      await Like.findByIdAndDelete(existingLike._id);
      isLiked = false;
      message = `${targetType} unliked successfully`;
    } else {
      // Like - create new like
      await Like.create({
        userId,
        targetId,
        targetType
      });
      isLiked = true;
      message = `${targetType} liked successfully`;
    }

    // Get updated likes count
    const likesCount = await Like.countDocuments({
      targetId,
      targetType
    });

    res.status(200).json({
      success: true,
      message,
      data: {
        isLiked,
        likesCount,
        targetId,
        targetType
      }
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing like'
    });
  }
};

// Get likes for a post/comment
const getLikes = async (req, res) => {
  try {
    const { targetId, targetType } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate input
    if (!['post', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Target type must be either "post" or "comment"'
      });
    }

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target ID format'
      });
    }

    // Check if target exists
    let target;
    if (targetType === 'post') {
      target = await Post.findById(targetId);
    } else {
      target = await Comment.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found`
      });
    }

    // Get likes with user information
    const likes = await Like.find({ targetId, targetType })
      .populate('userId', 'username fullName profileImage isVerified')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalLikes = await Like.countDocuments({ targetId, targetType });
    const totalPages = Math.ceil(totalLikes / limit);
    const hasMore = page < totalPages;

    res.status(200).json({
      success: true,
      data: {
        likes,
        pagination: {
          currentPage: page,
          totalPages,
          totalLikes,
          hasMore,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching likes'
    });
  }
};

//Check if user liked a post/comment
const checkUserLike = async (req, res) => {
  try {
    const { targetId, targetType } = req.params;
    const userId = req.user._id;

    // Validate input
    if (!['post', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Target type must be either "post" or "comment"'
      });
    }

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target ID format'
      });
    }

    // Check if user liked this item
    const userLike = await Like.findOne({
      userId,
      targetId,
      targetType
    });

    // Get total likes count
    const likesCount = await Like.countDocuments({
      targetId,
      targetType
    });

    res.status(200).json({
      success: true,
      data: {
        isLiked: !!userLike,
        likesCount,
        targetId,
        targetType
      }
    });

  } catch (error) {
    console.error('Error checking user like:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking like status'
    });
  }
};

// Get user's liked posts
const getUserLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's liked posts
    const likedPosts = await Like.find({ 
      userId, 
      targetType: 'post' 
    })
      .populate({
        path: 'targetId',
        populate: [
          { path: 'userId', select: 'username fullName profileImage isVerified' },
          { path: 'media' },
          { path: 'likesCount' },
          { path: 'commentsCount' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out likes where the post no longer exists
    const validLikedPosts = likedPosts.filter(like => like.targetId);

    // Get total count
    const totalLikedPosts = await Like.countDocuments({ 
      userId, 
      targetType: 'post' 
    });
    
    const totalPages = Math.ceil(totalLikedPosts / limit);
    const hasMore = page < totalPages;

    res.status(200).json({
      success: true,
      data: {
        likedPosts: validLikedPosts.map(like => ({
          ...like.targetId.toObject(),
          likedAt: like.createdAt
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalLikedPosts,
          hasMore,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error getting user liked posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching liked posts'
    });
  }
};

// Get recent likes for user's posts (notifications)
const getRecentLikes = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    // Get user's posts
    const userPosts = await Post.find({ userId }).select('_id');
    const postIds = userPosts.map(post => post._id);

    // Get recent likes on user's posts
    const recentLikes = await Like.find({
      targetId: { $in: postIds },
      targetType: 'post',
      userId: { $ne: userId } // Exclude user's own likes
    })
      .populate('userId', 'username fullName profileImage')
      .populate('targetId', 'caption media')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        recentLikes: recentLikes.map(like => ({
          id: like._id,
          user: like.userId,
          post: like.targetId,
          likedAt: like.createdAt,
          type: 'like'
        }))
      }
    });

  } catch (error) {
    console.error('Error getting recent likes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent likes'
    });
  }
};

// Get like statistics for a user
const getLikeStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's posts
    const userPosts = await Post.find({ userId }).select('_id');
    const postIds = userPosts.map(post => post._id);

    // Get statistics
    const stats = await Promise.all([
      // Total likes received on posts
      Like.countDocuments({
        targetId: { $in: postIds },
        targetType: 'post'
      }),
      // Total posts liked by user
      Like.countDocuments({
        userId,
        targetType: 'post'
      }),
      // Total comments liked by user
      Like.countDocuments({
        userId,
        targetType: 'comment'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        likesReceived: stats[0],
        postsLiked: stats[1],
        commentsLiked: stats[2],
        totalLikesGiven: stats[1] + stats[2]
      }
    });

  } catch (error) {
    console.error('Error getting like stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching like statistics'
    });
  }
};

module.exports = {
  toggleLike,
  getLikes,
  checkUserLike,
  getUserLikedPosts,
  getRecentLikes,
  getLikeStats
};