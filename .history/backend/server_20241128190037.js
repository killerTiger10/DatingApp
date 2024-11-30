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

/* ================================================================================================================================= */

// Import the Post model
const Post = require("./models/Post");

// Route to get all posts
const authenticate = require("./middlewares/authMiddleware");

// Protect the route
app.get("/posts", authenticate, async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// Route to create a new post
app.post("/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body); // Create a new post
    const savedPost = await newPost.save(); // Save to the database
    res.status(201).json(savedPost); // Send the saved post back
  } catch (err) {
    // Check if it's a Mongoose validation error
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((error) => error.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

// Route to update an existing post by ID
app.put("/posts/:id", async (req, res) => {
  const { title, content } = req.body;

  if (!title || title.length < 3) {
    return res
      .status(400)
      .json({ errors: ["Title must be at least 3 characters long"] });
  }

  if (!content || content.length < 10) {
    return res
      .status(400)
      .json({ errors: ["Content must be at least 10 characters long"] });
  }

  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating post", error: err.message });
  }
});

// Route to delete a post by ID
app.delete("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting post", error: err.message });
  }
});

// test
app.get("/error-test", (req, res, next) => {
  // Simulating an error
  const err = new Error("This is a test error!");
  err.status = 400; // You can set a custom status code
  next(err); // Pass the error to the error-handling middleware
});

// 404 Handler (Optional but recommended)
app.use((req, res, next) => {
  const err = new Error("Route not found");
  err.status = 404;
  next(err);
});

// Error-handling middleware (Centralized error handling)
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error
  res.status(500).json({ message: "An error occurred", error: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
