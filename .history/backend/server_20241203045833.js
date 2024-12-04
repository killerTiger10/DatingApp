const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Import the necessary routes and middlewares
const authRoutes = require("./routes/authRoutes");
const authenticate = require("./middlewares/authMiddleware");
const Post = require("./models/Post"); // Import Post model
const router = express.Router();
const profileController = require("../controllers/profileController");
const authenticate = require("../middleware/authenticate"); // Ensure that this middleware is in place
// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse incoming JSON requests

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
    console.error("MongoDB connection error:", err);
  });

// Handle MongoDB Connection Events
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

// Graceful MongoDB shutdown on application termination
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log(
      "Mongoose connection is disconnected due to application termination"
    );
    process.exit(0);
  });
});

/* ================================================================================================================================= */

// Routes for Posts
// Protect the following routes using the authentication middleware
app.get("/posts", authenticate, async (req, res) => {
  try {
    const posts = await Post.find(); // Fetch all posts from the database
    res.status(200).json(posts); // Return posts as a JSON response
  } catch (err) {
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// Route to create a new post
app.post("/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body); // Create a new post from the request body
    const savedPost = await newPost.save(); // Save the post to the database
    res.status(201).json(savedPost); // Return the saved post
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

  // Validation for title and content
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

    res.status(200).json(post); // Return the updated post
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

    res.status(200).json({ message: "Post deleted successfully" }); // Return success message
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting post", error: err.message });
  }
});

// Error Testing Route (for demonstration)
app.get("/error-test", (req, res, next) => {
  const err = new Error("This is a test error!");
  err.status = 400;
  next(err); // Pass the error to the error handler
});

/* ================================================================================================================================= */

// Routes for Authentication (Register & Login)
app.use("/auth", authRoutes); // Use the authentication routes

/*
  POST /auth/register    - Register a new user
  POST /auth/login       - Log in and return an auth token
*/
/* Routes for Profile */
// GET /profile - Get user's profile details
router.get("/profile", authenticate, profileController.getProfile);

// PUT /profile - Update user's profile details
router.put("/profile", authenticate, profileController.updateProfile);

module.exports = router;

/* ================================================================================================================================= */

// 404 Route Handler for unhandled routes
app.use((req, res, next) => {
  const err = new Error("Route not found");
  err.status = 404;
  next(err); // Pass the error to the error handler
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack
  res
    .status(err.status || 500)
    .json({ message: err.message || "An error occurred", error: err.message });
});

/* ================================================================================================================================= */

// Start the Express server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
/* ================================================================================================================================= */

// Close the Express Server
// process.on("SIGINT", () => {
//   server.close(() => {
//     console.log("Server closed gracefully");
//   });
// });

module.exports = app; // Export the app for testing
