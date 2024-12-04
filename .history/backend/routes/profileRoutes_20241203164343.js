const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

// Fetch user profile
router.get("/profile", getProfile);

// Update user profile
router.put("/profile", updateProfile);

module.exports = router;
