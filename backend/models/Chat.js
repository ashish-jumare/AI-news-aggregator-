const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: String,
  type: String,
  data: String // base64 encoded image data
}, { _id: false });

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  images: {
    type: [imageSchema],
    default: undefined
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'New Chat'
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  pinned: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Index for efficient querying
chatSchema.index({ userId: 1, updatedAt: -1 });

// Method to generate title from first user message
chatSchema.methods.generateTitle = function() {
  if (this.messages.length > 0) {
    const firstUserMessage = this.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      // Take first 50 characters of the message as title
      this.title = firstUserMessage.content.substring(0, 50).trim();
      if (firstUserMessage.content.length > 50) {
        this.title += '...';
      }
    }
  }
  return this.title;
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
