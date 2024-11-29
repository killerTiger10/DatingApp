const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"], // Validation: title must be provided
      minlength: [3, "Title must be at least 3 characters long"],
    },
    content: {
      type: String,
      required: [true, "Content is required"], // Validation: content must be provided
      minlength: [10, "Content must be at least 10 characters long"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
