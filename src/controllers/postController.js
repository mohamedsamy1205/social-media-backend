// controllers/postController.js
const Post = require('../models/Post');
const Media = require('../models/Media');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const User = require('../models/User'); // Added for array-based following
const { uploadToCloudinary } = require('../utils/fileUpload');

// CREATE POST
exports.createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // Validate input
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one media file is required' 
      });
    }

    if (files.length > 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 10 media files allowed per post' 
      });
    }

    // Create the post first
    const post = new Post({
      userId,
      caption: caption?.trim() || ''
     
    });

    await post.save();

    // Upload media files and create media records
    const mediaPromises = files.map(async (file, index) => {
      try {
        const uploadResult = await uploadToCloudinary(file, 'posts');
        
        const media = new Media({
          postId: post._id,
          mediaType: file.mimetype.startsWith('image') ? 'image' : 'video',
          mediaUrl: uploadResult.secure_url,
        
        });

        return media.save();
      } catch (uploadError) {
        console.error('Media upload error:', uploadError);
        throw new Error(`Failed to upload media file: ${file.originalname}`);
      }
    });

    await Promise.all(mediaPromises);

    // Return post with populated data
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username profileImage')
      .populate('media')
      .populate('likesCount')
      .populate('commentsCount');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
};


// GET FEED POSTS (posts from followed users + own posts)
exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get the current user with their following list
    const currentUser = await User.findById(userId).select('following');
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get the list of followed user IDs and include current user's ID
    const followedUserIds = [...currentUser.following, userId];

    const posts = await Post.find({ userId: { $in: followedUserIds } })
      .populate('userId', 'username profileImage') // Note: changed profilePicture to profileImage based on your schema
      .populate('media')
      .populate('likesCount')
      .populate('commentsCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ userId: { $in: followedUserIds } });
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
};
// GET SINGLE POST
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('userId', 'username profileImage')
      .populate('media')
      .populate('likesCount')
      .populate('commentsCount');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error.message
    });
  }
};

// GET USER'S POSTS
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId })
      .populate('media')
      .populate('likesCount')
      .populate('commentsCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
      error: error.message
    });
  }
};



exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption } = req.body; // This works for all form types
    const userId = req.user._id;

    // Validation
    if (!caption || caption.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Caption cannot be empty'
      });
    }

    // Check if post exists and user owns it
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        caption: caption.trim(),
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('userId', 'username profileImage')
      .populate('media')
      .populate('likesCount')
      .populate('commentsCount');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message
    });
  }
};

// DELETE POST
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Check if post exists and user owns it
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete associated data
    await Promise.all([
      Media.deleteMany({ postId }),
      Comment.deleteMany({ postId }),
      Like.deleteMany({ targetId: postId, targetType: 'post' }),
      Post.findByIdAndDelete(postId)
    ]);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
};