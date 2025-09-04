const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 2200 
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
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

// Virtual for likes count
postSchema.virtual('likesCount', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'targetId',
  count: true,
  match: { targetType: 'post' }
});

// Virtual for comments count
postSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
  count: true
});

// Virtual for media
postSchema.virtual('media', {
  ref: 'Media',
  localField: '_id',
  foreignField: 'postId'
});

// Compound index for user's posts ordered by date
postSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);