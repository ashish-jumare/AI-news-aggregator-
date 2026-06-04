const { fetchNewsFromAPI, scrapeGoogleNews } = require('../services/newsService');
const { filterByTimeRange } = require('../utils/dateFilter');
const { analyzeSentiment } = require('../utils/sentiment');

// Active SSE connections
const clients = new Map();

// Stream live news via SSE
const streamLiveNews = async (req, res) => {
  const { company, filterDays, limit } = req.query;

  if (!company) {
    return res.status(400).json({ error: 'Company parameter is required' });
  }

  const articleLimit = parseInt(limit) || 200; // Default to 200 if not specified

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const allowedOrigin = process.env.FRONTEND_URL;
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Stream started' })}\n\n`);

  const clientId = Date.now();
  clients.set(clientId, res);

  // Function to fetch and send news
  const sendNews = async () => {
    try {
      let newsData = [];
      const filterDaysInt = parseInt(filterDays) || 0;

      // DUAL-SOURCE STRATEGY:
      // PRIORITY 1: Google News RSS (real-time, unlimited requests)
      try {
        newsData = await scrapeGoogleNews(company, articleLimit);
        console.log(` [SOURCE 1/2] Google RSS: ${newsData.length} real-time articles`);
      } catch (scraperError) {
        console.log(' [SOURCE 1/2] Google RSS failed, continuing...');
      }

      // PRIORITY 2: NewsAPI (backup fallback, 30-day limit, 100 requests/day)
      // Only use if we have no articles at all
      if (newsData.length === 0) {
        try {
          newsData = await fetchNewsFromAPI(company);
          console.log(` [SOURCE 2/2] NewsAPI fallback: ${newsData.length} articles (24hr delay)`);
        } catch (apiError) {
          console.error(` [SOURCE 2/2] NewsAPI failed: ${apiError.message}`);
          console.error(' All sources failed!');
        }
      } else {
        console.log(' [SOURCE 2/2] NewsAPI skipped (already have articles)');
      }

      // Apply time filter if enabled
      if (filterDaysInt > 0) {
        const beforeFilter = newsData.length;
        newsData = filterByTimeRange(newsData, filterDaysInt);
        console.log(` Filtered: ${beforeFilter} → ${newsData.length} articles (last ${filterDaysInt} days)`);
      }

      // Sort by date - if filter is enabled, show oldest first (e.g., 90 days ago on top)
      // Otherwise show latest first (most recent on top)
      if (filterDaysInt > 0) {
        newsData.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)); // Oldest first
        console.log(` Sorted: Oldest → Newest (${filterDaysInt} days ago at top)`);
      } else {
        newsData.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)); // Most recent first
        console.log(' Sorted: Newest → Oldest (latest at top)');
      }

      // Add sentiment analysis using batch processing (much faster!)
      const { analyzeSentimentBatch } = require('../utils/sentiment');
      newsData = await analyzeSentimentBatch(newsData, 'news');

      console.log(` Final result: ${newsData.length} articles ready to send\n`);

      // Send news data to client
      if (clients.has(clientId)) {
        res.write(`data: ${JSON.stringify({ type: 'news', data: newsData, timestamp: new Date() })}\n\n`);
      }
    } catch (error) {
      console.error('Error fetching news:', error.message);
      if (clients.has(clientId)) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      }
    }
  };

  // Send news immediately
  await sendNews();

  // Set interval to send updates every 60 seconds
  const intervalId = setInterval(sendNews, 60000);

  // Clean up on client disconnect
  req.on('close', () => {
    console.log(`🔌 Client ${clientId} disconnected`);
    clearInterval(intervalId);
    clients.delete(clientId);
  });
};

module.exports = { streamLiveNews };
