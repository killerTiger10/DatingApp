const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const profileController = require("../controllers/profileController");

// Fetch user profile
router.get("/profile", profileController.getProfile);

// Update user profile
router.put("/profile", profileController.updateProfile);

module.exports = router;
