const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, password, fullName, dateOfBirth, gender } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      fullName,
      dateOfBirth,
      gender
    });

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
