const express = require('express');
const router = express.Router();
const { generateResponse, generateStreamingResponse } = require('../services/geminiService');

/**
 * POST /api/gemini/chat
 * Generate a response from Gemini AI
 * Body: { messages: [{ role: 'user'|'assistant', content: string }] }
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required and must not be empty'
      });
    }

    // Validate message format
    const validMessages = messages.every(msg => 
      msg.role && msg.content && 
      (msg.role === 'user' || msg.role === 'assistant')
    );

    if (!validMessages) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message format. Each message must have role and content.'
      });
    }

    // Generate response
    const response = await generateResponse(messages);

    res.json({
      success: true,
      response: response,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error in Gemini chat:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI response',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/gemini/chat/stream
 * Generate a streaming response from Gemini AI
 * Body: { messages: [{ role: 'user'|'assistant', content: string }] }
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required and must not be empty'
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send chunks as they arrive
    await generateStreamingResponse(messages, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    // Send completion signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error in Gemini streaming chat:', error);
    res.write(`data: ${JSON.stringify({ 
      error: true, 
      message: error.message 
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/gemini/health
 * Check if Gemini service is available
 */
router.get('/health', (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  
  res.json({
    success: true,
    configured: isConfigured,
    model: 'gemini-3-flash-preview',
    message: isConfigured 
      ? 'Gemini AI is configured and ready' 
      : 'Gemini API key not configured'
  });
});

module.exports = router;
