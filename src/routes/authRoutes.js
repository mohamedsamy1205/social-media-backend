const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "Welcome, this is a protected route", user: req.user });
});

router.post("/register", register);
router.post("/login", login);

module.exports = router;
