const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticate = require("../middlewares/authMiddleware");

// Update User Profile
router.put("/profile", authenticate, async (req, res) => {
  const { age, gender, location, interests, profilePicture, bio, preferences } =
    req.body;

  // Validate incoming fields (can adjust as necessary)
  if (!age || !gender || !location) {
    return res
      .status(400)
      .json({ error: "Age, gender, and location are required" });
  }

  try {
    // Find user by ID (from the token)
    const user = await User.findById(req.user.id); // Assuming you set `req.user` from the auth middleware
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's profile with the new values
    user.age = age || user.age;
    user.gender = gender || user.gender;
    user.location = location || user.location;
    user.interests = interests || user.interests;
    user.profilePicture = profilePicture || user.profilePicture;
    user.bio = bio || user.bio;
    user.preferences = preferences || user.preferences;

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
