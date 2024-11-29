// backend/models/Post.js
const mongoose = require("mongoose");

// Define the schema for a post
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Title is required
  },
  content: {
    type: String,
    required: true, // Content is required
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the current date
  },
});

// Create the Post model based on the schema
const Post = mongoose.model("Post", postSchema);

module.exports = Post; // Export the model so we can use it elsewhere
