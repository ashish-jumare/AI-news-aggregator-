const express = require('express');
const router = express.Router();
const { streamLiveNews } = require('../controllers/newsController');

// SSE endpoint for live news streaming
router.get('/live', streamLiveNews);

module.exports = router;
