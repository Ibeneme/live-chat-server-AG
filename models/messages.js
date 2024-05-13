const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  timeSent: {
    type: Date,
    default: Date.now
  },
  message: {
    type: String,
    required: true
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
