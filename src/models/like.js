const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes
likeSchema.index({ targetId: 1, targetType: 1 }); // Get all likes for a post/comment
likeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true }); // Prevent duplicate likes

module.exports = mongoose.model('Like', likeSchema);