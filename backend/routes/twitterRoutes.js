const express = require('express');
const { getCompanyTweets, getCompanyHandle, getAvailableCompanies, getStoredTweets } = require('../services/twitterService');

const router = express.Router();

/**
 * GET /api/twitter/tweets/:companyName
 * Fetch tweets for a specific company
 */
router.get('/tweets/:companyName', async (req, res) => {
  try {
    const { companyName } = req.params;
    const maxResults = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate; // Optional date filter
    const endDate = req.query.endDate; // Optional date filter
    const nextToken = req.query.next_token; // Pagination token
    const excludeTweetIds = req.query.excludeTweetIds ? req.query.excludeTweetIds.split(',') : []; // Already seen tweets
    const excludeAuthorIds = req.query.excludeAuthorIds ? req.query.excludeAuthorIds.split(',') : []; // Already seen authors
    
    console.log(`📱 API Request: Fetching tweets for "${companyName}" (limit: ${maxResults})`);
    if (startDate || endDate) {
      console.log(`📅 Date filter: ${startDate || 'any'} to ${endDate || 'any'}`);
    }
    if (nextToken) {
      console.log(`📄 Using pagination token: ${nextToken.substring(0, 20)}...`);
    }
    if (excludeAuthorIds.length > 0) {
      console.log(`🚫 Excluding ${excludeAuthorIds.length} authors to ensure uniqueness`);
    }
    
    const result = await getCompanyTweets(companyName, maxResults, { 
      startDate, 
      endDate, 
      nextToken,
      excludeTweetIds,
      excludeAuthorIds
    });
    
    if (result.success) {
      res.json(result);
    } else {
      // Send appropriate status code based on error type
      let statusCode = 500;
      
      if (result.errorType === 'RATE_LIMIT') {
        statusCode = 429;
      } else if (result.errorType === 'AUTH_ERROR') {
        statusCode = 401;
      } else if (result.errorType === 'FORBIDDEN') {
        statusCode = 403;
      } else {
        statusCode = 404;
      }
      
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('❌ Twitter route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/twitter/available
 * Get list of companies with Twitter API support
 */
router.get('/available', (req, res) => {
  const companies = getAvailableCompanies();
  res.json({
    success: true,
    companies,
    count: companies.length,
    message: 'Twitter API is currently configured for these companies'
  });
});

/**
 * GET /api/twitter/handle/:companyName
 * Get Twitter handle for a specific company
 */
router.get('/handle/:companyName', (req, res) => {
  const { companyName } = req.params;
  const handle = getCompanyHandle(companyName);
  
  if (handle) {
    res.json({
      success: true,
      company: companyName,
      handle
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Company not found or Twitter handle not configured',
      company: companyName
    });
  }
});

/**
 * GET /api/twitter/stored/:companyName
 * Get stored tweets from database for a specific company
 */
router.get('/stored/:companyName', async (req, res) => {
  try {
    const { companyName } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const startDate = req.query.startDate; // Optional date filter
    const endDate = req.query.endDate; // Optional date filter
    
    console.log(`📂 API Request: Fetching stored tweets for "${companyName}" (limit: ${limit})`);
    if (startDate || endDate) {
      console.log(`📅 Date filter: ${startDate || 'any'} to ${endDate || 'any'}`);
    }
    
    const result = await getStoredTweets(companyName, limit, { startDate, endDate });
    
    res.json(result);
  } catch (error) {
    console.error('❌ Stored tweets route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stored tweets',
      message: error.message
    });
  }
});

module.exports = router;
