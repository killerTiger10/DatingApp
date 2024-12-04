const User = require("../models/User");
const mongoose = require("mongoose");

// Fetch user profile
const getProfile = async (req, res) => {
  try {
    // Fetch the user from the database, excluding the password field
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const {
    username,
    email,
    firstName,
    lastName,
    bio,
    location,
    interests,
    profilePicture,
    preferences,
  } = req.body;

  try {
    console.log("User ID: ", req.user.id);
    // Validate the user ID
    if (!mongoose.isValidObjectId(req.user.id)) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare the updated data object
    const updatedData = {};
    if (username) updatedData.username = username;
    if (email) updatedData.email = email;
    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (bio) updatedData.bio = bio;
    if (location) updatedData.location = location;
    if (interests) updatedData.interests = interests;
    if (profilePicture) updatedData.profilePicture = profilePicture;
    if (preferences) updatedData.preferences = preferences;

    // Update the user in the database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatedData },
      { new: true, runValidators: true }
    ).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the updated user profile
    res.status(200).json(user);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getProfile, updateProfile };
