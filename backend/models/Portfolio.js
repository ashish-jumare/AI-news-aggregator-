const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  qty: {
    type: Number,
    required: true,
    min: 0
  },
  avgCost: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  executedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cashBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  holdings: {
    type: [holdingSchema],
    default: []
  },
  transactions: {
    type: [transactionSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
