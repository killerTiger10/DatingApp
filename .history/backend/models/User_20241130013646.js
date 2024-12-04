// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: [true, "Username is required"],
//     unique: true,
//   },
//   email: {
//     type: String,
//     required: [true, "Email is required"],
//     unique: true,
//     match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
//     lowercase: true, // Ensure email is saved in lowercase
//   },
//   password: {
//     type: String,
//     required: [true, "Password is required"],
//     // minlength: [6, "Password must be at least 6 characters long"],
//     // You can add more password validation here (e.g., regex for complexity)
//   },
// });

// // Hash the password before saving
// UserSchema.pre("save", async function (next) {
//   if (this.isModified("password")) {
//     this.password = await bcrypt.hash(this.password, 10); // Hash password before saving
//   }
//   next();
// });

// // Method to compare password
// UserSchema.methods.isPasswordValid = async function (password) {
//   return await bcrypt.compare(password, this.password); // Compare plain password with hashed password
// };

// const User = mongoose.model("User", UserSchema);

// module.exports = User;
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
  },
  age: {
    type: Number,
    required: [true, "Age is required"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: [true, "Gender is required"],
  },
  location: {
    type: String,
    required: [true, "Location is required"],
  },
  interests: {
    type: [String],
    default: [],
  },
  profilePicture: {
    type: String, // URL to the profile picture or a file reference
  },
  preferences: {
    gender: {
      type: [String],
      enum: ["Male", "Female", "Other"],
      default: ["Male", "Female"],
    },
    minAge: {
      type: Number,
      default: 18,
    },
    maxAge: {
      type: Number,
      default: 100,
    },
  },
  bio: {
    type: String,
    maxlength: 300, // Limit bio to 300 characters
  },
  createdAt: {
    type: Date,
    default: Date.now,
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
