// Import necessary modules
const mongoose = require("mongoose");

// Define User schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Ensures email addresses are unique
      trim: true, // Removes any leading/trailing whitespace
    },
    fullName: {
      type: String,
    },
    lastMessage: {
      type: String,
    },
    seen: {
      type: Boolean,
      default: true, // Set default value for seen to true
    },
    messageCounts: {
      type: Number,
      default: 0, // Set default value for messageCounts to 0
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } } // Add timestamps option to automatically manage created_at and updated_at fields
);

// Create User model
const User = mongoose.model("User", userSchema);

// Export User model
module.exports = User;
