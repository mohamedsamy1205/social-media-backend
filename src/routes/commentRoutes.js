
const express = require('express');
const router = express.Router();
const {
  createComment,
  getPostComments,
  getComment,
  updateComment,
  deleteComment,
  getUserComments,
  toggleCommentLike
} = require('../controllers/commentController');



// Import middleware (you'll need to create these)
const authMiddleware = require('../middleware/authMiddleware');

const validateComment = require('../middleware/validation'); 



router.post('/', authMiddleware, validateComment, createComment);
router.get('/post/:postId', getPostComments);
router.get('/user/:userId', getUserComments);
router.get('/:commentId', getComment);
router.put('/:commentId', authMiddleware, validateComment, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);
router.post('/:commentId/like', authMiddleware, toggleCommentLike);



module.exports = router;