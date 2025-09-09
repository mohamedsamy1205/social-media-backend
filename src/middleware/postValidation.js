// middleware/postValidation.js
const { body, param, validationResult } = require('express-validator');

// Validation for creating a post
const validateCreatePost = [
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Caption cannot exceed 2200 characters')
    .trim(),
  
  // Custom validation for files
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one media file is required'
      });
    }

    // Check file count
    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 files allowed per post'
      });
    }

    next();
  }
];

// Validation for updating a post
const validateUpdatePost = [
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Caption cannot exceed 2200 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim()
];

// Validation for post ID parameter
const validatePostId = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

// Validation for user ID parameter
const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  
  next();
};

module.exports = {
  validateCreatePost,
  validateUpdatePost,
  validatePostId,
  validateUserId,
  handleValidationErrors
};