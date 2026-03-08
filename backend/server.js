const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(express.json({ limit: '10mb' })); // Support image uploads in LLM chat

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/twitter', twitterRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/chats', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
