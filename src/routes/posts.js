// routes/posts.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { upload } = require('../utils/fileUpload');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// POST /api/posts - Create a new post
router.post('/', upload.array('media', 10), postController.createPost);

// GET /api/posts - Get all posts (feed)
router.get('/', postController.getAllPosts);

// GET /api/posts/:postId - Get single post
router.get('/:postId', postController.getPost);

// GET /api/posts/user/:userId - Get user's posts
router.get('/user/:userId', postController.getUserPosts);

// PUT /api/posts/:postId - Update post
router.put('/:postId', postController.updatePost);

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', postController.deletePost);

module.exports = router;