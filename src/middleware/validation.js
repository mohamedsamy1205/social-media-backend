const { body, validationResult } = require('express-validator');

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
        errors: errors.array().map(e => e.msg)
      });
    }
    next();
  }
];

module.exports = validateComment; // <--- export directly
