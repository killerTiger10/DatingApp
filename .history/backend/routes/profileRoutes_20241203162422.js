const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const profileController = require("../controllers/profileController");

// Fetch user profile
router.get("/profile", authenticate, profileController.getProfile);

// Update user profile
router.put("/profile", authenticate, profileController.updateProfile);

module.exports = router;
