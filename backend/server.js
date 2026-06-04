const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./config/database');
const { initializeFinBERT } = require('./services/finbertService');
const { initializeGemini } = require('./services/geminiService');
const newsRoutes = require('./routes/news');
const twitterRoutes = require('./routes/twitterRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const contactRoutes = require('./routes/contactRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes = require('./routes/authRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy headers when behind a load balancer (Render, Nginx, etc.)
app.set('trust proxy', 1);

const requireEnv = (name) => {
  if (!process.env[name]) {
    throw new Error(`${name} is required but missing`);
  }
};

try {
  requireEnv('MONGODB_URI');
  requireEnv('JWT_SECRET');
  requireEnv('GOOGLE_CLIENT_ID');
  requireEnv('GEMINI_API_KEY');
} catch (error) {
  console.error(`[31m${error.message}[0m`);
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Initialize FinBERT service
initializeFinBERT();

// Initialize Gemini AI service
initializeGemini();

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' })); // Support image uploads in LLM chat

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false
});

const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/twitter', twitterRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/contacts', writeLimiter, contactRoutes);
app.use('/api/feedback', writeLimiter, feedbackRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/gemini', writeLimiter, geminiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
