const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON data

// Basic Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected...");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });
// Handling Connection
const db = mongoose.connection;
db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});
db.once("open", () => {
  console.log("Connected to MongoDB");
});
db.on("disconnected", () => {
  console.log("Disconnected from MongoDB");
});

// Close the connection
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log(
      "Mongoose connection is disconnected due to application termination"
    );
    process.exit(0);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

/* ================================================================================================================================= */

// Import the Post model
const Post = require("./models/Post");

// Route to get all posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find(); // Fetch all posts from the database
    res.json(posts); // Send the posts as a JSON response
    res.status(200).json({ error: "Fetched posts" });
  } catch (err) {
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// Route to create a new post
app.post("/posts", async (req, res) => {
  try {
    const { title, content } = req.body; // Get title and content from request body

    // Basic validation to ensure title and content are provided
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // Create a new post
    const newPost = new Post({
      title,
      content,
    });

    // Save the new post to MongoDB
    await newPost.save();

    // Send the saved post back as a response
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: "Error creating post" });
  }
});
