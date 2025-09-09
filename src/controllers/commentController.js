const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Post =require("../models/Post")
const mongoose = require('mongoose');


//  Create a new comment

const createComment = async (req,res)=>{

    try{
        const{postId,content}=req.body
        const userId = req.user._id


        if (!postId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and content are required'
      });
    } 

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
const comment = await Comment.create({
      postId,
      userId,
      content: content.trim()
    });

    // Populate user info and return
    await comment.populate('userId', 'username fullName profileImage');
    await comment.populate('likesCount');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating comment'
    });
}
}


//   Get comments for a post

const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate postId
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get comments with pagination
    const comments = await Comment.find({ postId })
      .populate('userId', 'username fullName profileImage isVerified')
      .populate('likesCount')
      .sort({ createdAt: 1 }) // Oldest first (Instagram style)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({ postId });
    const totalPages = Math.ceil(totalComments / limit);
    const hasMore = page < totalPages;

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalComments,
          hasMore,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error getting post comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
};

//  Get single comment
const getComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Validate commentId
    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    const comment = await Comment.findById(commentId)
      .populate('userId', 'username fullName profileImage isVerified')
      .populate('postId', 'caption')
      .populate('likesCount');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: comment
    });

  } catch (error) {
    console.error('Error getting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comment'
    });
  }
};

//    Update a comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

   
    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Update comment
    comment.content = content.trim();
    comment.updatedAt = new Date();
    await comment.save();

    // Populate and return
    await comment.populate('userId', 'username fullName profileImage');
    await comment.populate('likesCount');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating comment'
    });
  }
};

//   Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role; // Assuming role is available

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership or admin role
    if (comment.userId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Delete associated likes first
    await Like.deleteMany({ 
      targetId: commentId, 
      targetType: 'comment' 
    });

    // Delete comment
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
};

//  Get user's comments

const getUserComments = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const comments = await Comment.find({ userId })
      .populate('postId', 'caption media')
      .populate('likesCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalComments = await Comment.countDocuments({ userId });
    const totalPages = Math.ceil(totalComments / limit);
    const hasMore = page < totalPages;

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalComments,
          hasMore,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error getting user comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user comments'
    });
  }
};

// Like/Unlike a comment

const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId,
      targetId: commentId,
      targetType: 'comment'
    });

    let isLiked;
    
    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      isLiked = false;
    } else {
      // Like
      await Like.create({
        userId,
        targetId: commentId,
        targetType: 'comment'
      });
      isLiked = true;
    }

    // Get updated likes count
    const likesCount = await Like.countDocuments({
      targetId: commentId,
      targetType: 'comment'
    });

    res.status(200).json({
      success: true,
      message: isLiked ? 'Comment liked' : 'Comment unliked',
      data: {
        isLiked,
        likesCount
      }
    });

  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
};

module.exports = {
  createComment,
  getPostComments,
  getComment,
  updateComment,
  deleteComment,
  getUserComments,
  toggleCommentLike
};