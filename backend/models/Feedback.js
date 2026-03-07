const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Feedback category is required'],
    enum: ['bug', 'feature', 'ui', 'performance', 'data', 'general'],
    default: 'general'
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  attachScreenshot: {
    type: Boolean,
    default: false
  },
  systemInfo: {
    browser: {
      type: String,
      default: 'Unknown'
    },
    os: {
      type: String,
      default: 'Unknown'
    },
    screenResolution: {
      type: String,
      default: ''
    },
    currentPage: {
      type: String,
      default: ''
    }
  },
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Add indexes for faster queries
// Note: ticketNumber already has index via 'unique: true'
feedbackSchema.index({ email: 1, submittedAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ category: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
