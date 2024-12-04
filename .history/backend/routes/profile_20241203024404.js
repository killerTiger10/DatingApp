const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const profileController = require("../controllers/profileController");

// Fetch user profile
router.get("/", authMiddleware, profileController.getProfile);

// Update user profile
router.put("/", authMiddleware, profileController.updateProfile);

module.exports = router;
