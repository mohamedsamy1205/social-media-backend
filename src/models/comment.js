// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for likes count on comments
commentSchema.virtual('likesCount', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'targetId',
  count: true,
  match: { targetType: 'comment' }
});

// Index for getting post comments ordered by date
commentSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);