const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
const User = require("../models/User");
const { generateTokens } = require("../controllers/authController"); // Import the generateTokens function
const router = express.Router();
const cookieParser = require("cookie-parser");
router.use(cookieParser());

// Register a new user
router.post("/register", async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    age,
    gender,
    interests,
    location,
  } = req.body;
  console.log("Request payload:", req.body);

  // Validate input
  if (
    !username ||
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !age ||
    !gender ||
    !location
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log("e m a i l ! ! !");
      return res.status(400).json({ error: "Username already in use" });
    }

    // Validate age (e.g., ensure it's a number and above a certain threshold, such as 18+)
    if (typeof age !== "number" || age < 18) {
      console.log("{age issue}");
      return res
        .status(400)
        .json({ error: "Age must be a number and at least 18" });
    }
    // Normalize gender to match schema enum values (e.g., "male" to "Male")
    const formattedGender = (val) => {
      return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    };
    console.log("formatted Gender: -----------" + formattedGender(gender));
    // Validate gender (optional, based on your application's requirements)
    const validGenders = ["Male", "female", "non-binary", "other"];
    if (!validGenders.includes(formattedGender(gender))) {
      //gender.toLowerCase())) {
      return res.status(400).json({ error: "Invalid gender" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      age,
      gender: formattedGender(gender),
      location,
      interests: interests || [], // Default to an empty array if interests are not provided
    });

    await user.save();
    console.log("User created:", user);

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Return user data and tokens
    return res.status(201).json({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      gender: user.gender,
      interests: user.interests,
      location: user.location
      accessToken: accessToken,
      refreshToken: refreshToken,
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
    // Assuming you have the user's input password and the stored hashed password
    const userInputPassword = password;
    const storedHashedPassword = user.password;

    bcrypt.compare(userInputPassword, storedHashedPassword, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(401).json({ error: "Invalid credentials" });
        // Handle error, e.g., send an error response
      } else if (result) {
        // Passwords match, user is authenticated
        console.log("User authenticated successfully");
        // return res.status(401).json({ error: "Invalid credentials" });
      } /*else {
    // Passwords don't match, authentication failed
    console.log('Invalid password');
    return res.status(401).json({ error: "Invalid credentials" });
  }*/
    });
    /*
    console.log(password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
*/
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
      refreshToken,
    });
    console.log("end");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh the access token using the refresh token
router.post("/refresh", async (req, res) => {
  console.log(req.cookies);
  const refreshToken = req.cookies.refreshToken; // Access the refresh token from cookies

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
