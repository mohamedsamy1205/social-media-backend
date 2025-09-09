const { body, param, validationResult } = require('express-validator');


// Comment validation
const validateComment = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
    .escape(),

  body('postId')
    .if(body('postId').exists())
    .isMongoId()
    .withMessage('Invalid post ID format'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => e.msg),
      });
    }
    next();
  },
];


// Like validation

const validateLike = [
  body('targetId')
    .notEmpty()
    .withMessage('Target ID is required')
    .isMongoId()
    .withMessage('Invalid target ID format'),

  body('targetType')
    .notEmpty()
    .withMessage('Target type is required')
    .isIn(['post', 'comment'])
    .withMessage('Target type must be either "post" or "comment"'),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => error.msg),
      });
    }

    next();
  },
];


// Like params validation
const validateLikeParams = [
  param('targetId')
    .isMongoId()
    .withMessage('Invalid target ID format'),

  param('targetType')
    .isIn(['post', 'comment'])
    .withMessage('Target type must be either "post" or "comment"'),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => error.msg),
      });
    }

    next();
  },
];

// Export all validators
module.exports = {
  validateComment,
  validateLike,
  validateLikeParams,
};
