const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

// Fetch user profile
router.get("/view", authenticate, getProfile);

// Update user profile
router.put("/update", authenticate, updateProfile);

module.exports = router;
