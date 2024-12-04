const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const profileController = require("../controllers/profileController");

// Fetch user profile
router.get("/profile", authMiddleware, profileController.getProfile);

// Update user profile
router.put("/profile", authMiddleware, profileController.updateProfile);

module.exports = router;
