const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'default_user' // For now, using single user. Can extend to multi-user later
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    default: 'Unknown'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  urlToImage: {
    type: String,
    default: null
  },
  bookmarkedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Index for faster queries
bookmarkSchema.index({ userId: 1, company: 1 });
bookmarkSchema.index({ userId: 1, bookmarkedAt: -1 });

// Prevent duplicate bookmarks (same URL for same user)
bookmarkSchema.index({ userId: 1, url: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
