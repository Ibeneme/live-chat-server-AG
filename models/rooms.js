// Import necessary modules
const mongoose = require('mongoose');

// Define Room schema
const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true, // Ensures room IDs are unique
    trim: true // Removes any leading/trailing whitespace
  },
  nickname: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
});

// Create Room model
const Room = mongoose.model('Room', roomSchema);

// Export Room model
module.exports = Room;
