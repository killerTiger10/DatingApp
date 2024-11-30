const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    lowercase: true, // Ensure email is saved in lowercase
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    // minlength: [6, "Password must be at least 6 characters long"],
    // You can add more password validation here (e.g., regex for complexity)
  },
});

// Hash the password before saving
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10); // Hash password before saving
  }
  next();
});

// Method to compare password
UserSchema.methods.isPasswordValid = async function (password) {
  return await bcrypt.compare(password, this.password); // Compare plain password with hashed password
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
