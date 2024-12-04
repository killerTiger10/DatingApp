const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

// Fetch user profile
router.get("/view", getProfile);

// Update user profile
router.put("/update", updateProfile);

module.exports = router;
