const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
const User = require("../models/User");
const { generateTokens } = require("../controllers/authController"); // Import the generateTokens function
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Check if username already exists (optional)
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username,
      email,
      password: hashedPassword, // Save the hashed password
    });
    await user.save();
    console.log("User: ", user);
    // Generate JWT tokens (access and refresh)
    const { accessToken, refreshToken } = generateTokens(user);

    console.log("access: ", accessToken);
    console.log("refresh: ", refreshToken);
    // Return user data and both tokens
    res.status(201).json({
      username: user.username,
      email: user.email,
      accessToken, // Return the access token in the response
      refreshToken, // Return the refresh token in the response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the entered password with the stored hashed password
    console.log(password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT tokens (access and refresh)
    const { accessToken, refreshToken } = generateTokens(user);

    // Store the refresh token in an HttpOnly cookie for security
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return the access token and user data
    res.status(200).json({
      message: "Login successful",
      accessToken, // Return the access token
    });
    console.log("end");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh the access token using the refresh token
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.cookies; // Access the refresh token from cookies

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    // Verify and decode the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Find the user associated with the refresh token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate a new access token
    const { accessToken } = generateTokens(user);

    // Return the new access token
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

// Logout a user (clear the refresh token)
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
