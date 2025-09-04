const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  let token = null;

  // check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // get user from DB without password
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found, authorization denied" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

module.exports = authMiddleware;
