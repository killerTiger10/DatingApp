const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Assuming you're using Mongoose for MongoDB

// Function to generate both access and refresh tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Access token expires in 1 hour
  });

  const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Refresh token expires in 7 days
  });

  return { accessToken, refreshToken };
};

// Login function: generates both tokens and sends them to the user
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.isPasswordValid(password)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const { accessToken, refreshToken } = generateTokens(user);

  // Optionally store refreshToken securely (e.g., HttpOnly cookie)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Send the access token as part of the response
  res.json({ accessToken });
};

// Refresh token function: generates a new access token using the refresh token
const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.cookies; // Assuming the refresh token is stored in cookies

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Find the user associated with the refresh token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const { accessToken } = generateTokens(user);

    // Send the new access token in the response
    res.json({ accessToken });
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

// Logout function: clear the refresh token cookie
const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { login, refreshAccessToken, logout };
