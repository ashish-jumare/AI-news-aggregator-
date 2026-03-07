const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  tweetId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  handle: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true
  },
  author: {
    id: String,
    username: String,
    name: String,
    profileImage: String,
    verified: Boolean
  },
  createdAt: {
    type: Date,
    required: true
  },
  metrics: {
    likes: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  sentimentColor: {
    type: String,
    default: 'gray'
  },
  sentimentEmoji: {
    type: String,
    default: '😐'
  },
  sentimentConfidence: {
    type: Number,
    default: 0
  },
  url: {
    type: String,
    required: true
  },
  isRetweet: {
    type: Boolean,
    default: false
  },
  entities: {
    type: Object,
    default: {}
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Compound index for efficient querying by company and date
tweetSchema.index({ company: 1, createdAt: -1 });
tweetSchema.index({ company: 1, fetchedAt: -1 });

// TTL index - automatically delete tweets older than 30 days
tweetSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;
