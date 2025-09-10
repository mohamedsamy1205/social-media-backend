require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initSocket } = require("./src/socketio/Socket");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");





const app = express();

// Security middleware
app.use(helmet());
app.use(cors());


app.use(express.json());



const server = http.createServer(app);
const io = new Server(server);

initSocket(server);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes 
const commentRoutes = require('./src/routes/commentRoutes');
const postRoutes = require('./src/routes/posts');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const likeRoute=require('./src/routes/likeRoutes')



// API Routes 
app.use('/api/comment', commentRoutes);
app.use('/api/like',likeRoute)
app.use('/api/post', postRoutes);
app.use('/api/user', userRoutes);  
app.use('/api/auth', authRoutes);



// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;