const express = require("express");
const { initSocket } = require("./src/socketio/NotifSocket");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");



dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();
initSocket(server);

app.use("/api/auth", require("./src/routes/authRoutes.js"));
app.use("/api/users", require("./src/routes/userRoutes.js"));
app.use("/api/posts", require("./src/routes/posts.js"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
