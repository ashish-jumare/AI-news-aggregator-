const axios = require('axios');
const Tweet = require('../models/Tweet');

// Top 10 NIFTY companies enabled for Twitter API
const TWITTER_HANDLES = {
  'Reliance Industries Ltd.': 'RIL_Updates',
  'Tata Consultancy Services Ltd.': 'TCS_News',
  'Infosys Ltd.': 'Infosys',
  'HDFC Bank Ltd.': 'HDFC_Bank',
  'ICICI Bank Ltd.': 'ICICIBank',
  'Bharti Airtel Ltd.': 'airtelindia',
  'State Bank of India': 'TheOfficialSBI',
  'Hindustan Unilever Ltd.': 'HUL_News',
  'ITC Ltd.': 'ITCCorpCom',
  'Larsen & Toubro Ltd.': 'LarsenToubro'
};

// Cache to store tweets and reduce API calls
const tweetCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting tracker
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests (15 requests per minute = 1 per 4 seconds)

// Sentiment analysis keywords
const SENTIMENT_KEYWORDS = {
  positive: [
    'profit', 'growth', 'record', 'success', 'win', 'gain', 'up', 'rise', 'surge',
    'achieve', 'launch', 'innovation', 'partnership', 'expansion', 'milestone',
    'breakthrough', 'award', 'best', 'leading', 'strong', 'excellent', 'positive',
    'improvement', 'boost', 'increase', 'higher', 'revenue', 'outstanding',
    'pleased', 'excited', 'proud', 'celebrate', 'congratulations',
    'good', 'great', 'happy', 'opportunity', 'optimistic', 'bullish', 'advanced',
    'better', 'benefit', 'enhance', 'upgrade', 'progress', 'accomplish'
  ],
  negative: [
    'loss', 'decline', 'fall', 'drop', 'down', 'decrease', 'concern', 'issue',
    'problem', 'risk', 'warning', 'crisis', 'failure', 'weak', 'poor', 'worse',
    'negative', 'challenge', 'difficult', 'struggle', 'disappointing', 'cut',
    'reduce', 'layoff', 'recession', 'debt', 'lawsuit', 'fine', 'penalty',
    'scandal', 'controversy', 'investigation', 'probe', 'bearish', 'worry',
    'damage', 'threat', 'critical', 'serious', 'delay', 'suspended'
  ],
  neutral: [
    'announce', 'report', 'statement', 'update', 'meeting', 'discuss', 'plan',
    'consider', 'review', 'schedule', 'upcoming', 'event', 'conference', 'today'
  ]
};

/**
 * Analyze sentiment of tweet text
 */
function analyzeSentiment(text) {
  const lowercaseText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  // Count positive keywords
  SENTIMENT_KEYWORDS.positive.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowercaseText.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  // Count negative keywords
  SENTIMENT_KEYWORDS.negative.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowercaseText.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  // Count neutral keywords
  SENTIMENT_KEYWORDS.neutral.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowercaseText.match(regex);
    if (matches) neutralCount += matches.length;
  });
  
  // Determine sentiment
  let sentiment = 'neutral';
  let sentimentColor = 'gray';
  let sentimentEmoji = '😐';
  let confidence = 0;
  
  if (positiveCount > negativeCount && positiveCount > 0) {
    sentiment = 'positive';
    sentimentColor = 'green';
    sentimentEmoji = '😊';
    confidence = Math.min((positiveCount / (positiveCount + negativeCount)) * 100, 100);
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    sentiment = 'negative';
    sentimentColor = 'red';
    sentimentEmoji = '😟';
    confidence = Math.min((negativeCount / (positiveCount + negativeCount)) * 100, 100);
  } else {
    confidence = 50;
  }
  
  return {
    sentiment,
    sentimentColor,
    sentimentEmoji,
    confidence: Math.round(confidence),
    keywordCounts: {
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount
    }
  };
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry) {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
}

/**
 * Wait to respect rate limits
 */
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Fetch tweets for Infosys using Twitter API v2
 * @param {string} companyName - Company name (only works for Infosys Ltd.)
 * @param {number} maxResults - Maximum number of tweets (default: 10, max: 100)
 * @param {Object} options - Options including dateFilter, nextToken, excludeTweetIds, excludeAuthorIds
 * @returns {Promise<Object>} Tweet data with success status
 */
async function getCompanyTweets(companyName, maxResults = 10, options = {}) {
  try {
    const { startDate, endDate, nextToken, excludeTweetIds = [], excludeAuthorIds = [] } = options;
    
    // Check if company is API-enabled
    const handle = TWITTER_HANDLES[companyName];
    
    if (!handle) {
      return {
        success: false,
        error: `Twitter API is only configured for top 10 NIFTY companies. Available: ${Object.keys(TWITTER_HANDLES).join(', ')}`,
        companyName,
        availableCompanies: Object.keys(TWITTER_HANDLES),
        useWidget: true
      };
    }

    // Check cache first
    const cacheKey = `${companyName}_${maxResults}`;
    const cached = tweetCache.get(cacheKey);
    if (isCacheValid(cached)) {
      console.log('✅ Returning cached tweets for', companyName);
      return {
        ...cached.data,
        fromCache: true
      };
    }

    // Check if Bearer Token is configured
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken || bearerToken === 'your_bearer_token_here') {
      console.error('❌ Twitter Bearer Token not configured');
      return {
        success: false,
        error: 'Twitter API credentials not configured. Please add TWITTER_BEARER_TOKEN to .env file',
        companyName,
        handle,
        errorType: 'AUTH_ERROR'
      };
    }

    // Wait to respect rate limits
    await waitForRateLimit();

    console.log(`🐦 Searching tweets about ${companyName} (@${handle})...`);

    // Search for tweets about the company (mentions, company name, or handle)
    // Build a search query to find tweets mentioning the company
    const searchQuery = `(@${handle} OR "${companyName}") -is:retweet lang:en`;
    
    // Build API parameters
    const apiParams = {
      query: searchQuery,
      max_results: Math.min(maxResults * 3, 100), // Fetch 3x more to filter duplicates
      'tweet.fields': 'created_at,public_metrics,entities,referenced_tweets,author_id',
      'expansions': 'author_id,attachments.media_keys,referenced_tweets.id',
      'user.fields': 'username,name,profile_image_url,verified',
      'media.fields': 'url,preview_image_url,type'
    };
    
    // Add pagination token if provided
    if (nextToken) {
      apiParams.pagination_token = nextToken;
      console.log(`📄 Continuing from pagination token`);
    }
    
    // Add date filters if provided (Twitter API expects ISO 8601 format)
    if (startDate) {
      apiParams.start_time = new Date(startDate).toISOString();
      console.log(`📅 Filtering from: ${apiParams.start_time}`);
    }
    if (endDate) {
      // Add 23:59:59 to end date to include the entire day
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      apiParams.end_time = endDateObj.toISOString();
      console.log(`📅 Filtering until: ${apiParams.end_time}`);
    }
    
    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/tweets/search/recent`,
      {
        params: apiParams,
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!tweetsResponse.data?.data || tweetsResponse.data.data.length === 0) {
      return {
        success: false,
        error: 'No tweets found about this company',
        handle,
        companyName
      };
    }

    const tweets = tweetsResponse.data.data;
    const users = tweetsResponse.data.includes?.users || [];
    const nextPageToken = tweetsResponse.data.meta?.next_token; // Get pagination token for next page
    
    console.log(`✅ Found ${tweets.length} tweets about ${companyName}`);
    if (nextPageToken) {
      console.log(`📄 Next page available with token: ${nextPageToken.substring(0, 20)}...`);
    }

    // Create a map of user IDs to user data for easy lookup
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Track seen authors to ensure uniqueness
    const seenAuthors = new Set(excludeAuthorIds);

    // Format tweets for frontend with sentiment analysis and deduplication
    const formattedTweets = tweets
      .filter(tweet => {
        // Exclude already-seen tweets
        if (excludeTweetIds.includes(tweet.id)) {
          console.log(`🚫 Skipping duplicate tweet: ${tweet.id}`);
          return false;
        }
        
        // Ensure unique authors only
        if (seenAuthors.has(tweet.author_id)) {
          console.log(`🚫 Skipping duplicate author: ${tweet.author_id}`);
          return false;
        }
        
        seenAuthors.add(tweet.author_id);
        return true;
      })
      .slice(0, maxResults) // Take only requested amount after filtering
      .map(tweet => {
      const sentimentAnalysis = analyzeSentiment(tweet.text);
      const author = userMap.get(tweet.author_id) || { username: 'unknown', name: 'Unknown User' };
      
      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        views: tweet.public_metrics?.impression_count || 0,
        url: `https://twitter.com/${author.username}/status/${tweet.id}`,
        isRetweet: tweet.referenced_tweets?.some(ref => ref.type === 'retweeted') || false,
        entities: tweet.entities || {},
        // Author information
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          profileImage: author.profile_image_url,
          verified: author.verified || false
        },
        // Sentiment analysis
        sentiment: sentimentAnalysis.sentiment,
        sentimentColor: sentimentAnalysis.sentimentColor,
        sentimentEmoji: sentimentAnalysis.sentimentEmoji,
        sentimentConfidence: sentimentAnalysis.confidence,
        sentimentKeywords: sentimentAnalysis.keywordCounts
      };
    });

    // Calculate engagement metrics
    const totalEngagement = formattedTweets.reduce((sum, t) => 
      sum + t.likes + t.retweets + t.replies, 0
    );
    const avgEngagement = Math.round(totalEngagement / formattedTweets.length);

    // Calculate sentiment distribution
    const sentimentDistribution = {
      positive: formattedTweets.filter(t => t.sentiment === 'positive').length,
      negative: formattedTweets.filter(t => t.sentiment === 'negative').length,
      neutral: formattedTweets.filter(t => t.sentiment === 'neutral').length
    };

    const result = {
      success: true,
      tweets: formattedTweets,
      handle,
      searchQuery,
      username: handle,
      displayName: companyName,
      totalTweets: formattedTweets.length,
      avgEngagement,
      sentimentDistribution,
      nextToken: nextPageToken, // Include pagination token for next fetch
      hasMore: !!nextPageToken, // Indicate if more tweets are available
      fetchedAt: new Date().toISOString(),
      isRealData: true,
      fromCache: false,
      isAboutCompany: true
    };

    // Cache the result
    tweetCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    console.log('✅ Successfully fetched and cached tweets');
    console.log(`📊 Sentiment: ${sentimentDistribution.positive} positive, ${sentimentDistribution.negative} negative, ${sentimentDistribution.neutral} neutral`);

    // Save tweets to database (async, don't wait)
    saveTweetsToDatabase(formattedTweets, companyName, handle).catch(err => {
      console.error('⚠️ Failed to save tweets to database:', err.message);
    });

    return result;

  } catch (error) {
    console.error('❌ Twitter API Error:', error.response?.data || error.message);
    
    // Handle specific error codes
    if (error.response?.status === 429) {
      return {
        success: false,
        error: 'Rate limit exceeded. Twitter Free API allows 15 requests per 15 minutes. Please wait a few minutes and try again.',
        errorType: 'RATE_LIMIT',
        retryAfter: 900,
        companyName
      };
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        error: 'Invalid Twitter API credentials. Please check your Bearer Token in .env file',
        errorType: 'AUTH_ERROR',
        companyName
      };
    }

    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch tweets',
      errorType: 'UNKNOWN_ERROR',
      handle: TWITTER_HANDLES[companyName],
      companyName
    };
  }
}

/**
 * Clear cache (can be called manually if needed)
 */
function clearCache() {
  tweetCache.clear();
  console.log('🗑️ Tweet cache cleared');
}

/**
 * Get Twitter handle for a company
 */
function getCompanyHandle(companyName) {
  return TWITTER_HANDLES[companyName] || null;
}

/**
 * Get list of companies with Twitter handles
 */
function getAvailableCompanies() {
  return Object.keys(TWITTER_HANDLES);
}

/**
 * Save tweets to MongoDB database
 * @param {Array} tweets - Array of formatted tweets
 * @param {string} companyName - Company name
 * @param {string} handle - Twitter handle
 */
async function saveTweetsToDatabase(tweets, companyName, handle) {
  try {
    console.log(`💾 Saving ${tweets.length} tweets to database for ${companyName}...`);
    
    const savePromises = tweets.map(async (tweet) => {
      try {
        await Tweet.findOneAndUpdate(
          { tweetId: tweet.id }, // Find by unique tweet ID
          {
            tweetId: tweet.id,
            company: companyName,
            handle: handle,
            text: tweet.text,
            author: tweet.author,
            createdAt: new Date(tweet.createdAt),
            metrics: {
              likes: tweet.likes,
              retweets: tweet.retweets,
              replies: tweet.replies,
              views: tweet.views
            },
            sentiment: tweet.sentiment,
            sentimentColor: tweet.sentimentColor,
            sentimentEmoji: tweet.sentimentEmoji,
            sentimentConfidence: tweet.sentimentConfidence,
            url: tweet.url,
            isRetweet: tweet.isRetweet,
            entities: tweet.entities,
            fetchedAt: new Date()
          },
          { 
            upsert: true, // Create if doesn't exist
            new: true,
            setDefaultsOnInsert: true
          }
        );
      } catch (err) {
        console.error(`⚠️ Failed to save tweet ${tweet.id}:`, err.message);
      }
    });

    await Promise.all(savePromises);
    console.log(`✅ Successfully saved ${tweets.length} tweets to database`);
  } catch (error) {
    console.error('❌ Error saving tweets to database:', error.message);
    throw error;
  }
}

/**
 * Get stored tweets from database
 * @param {string} companyName - Company name
 * @param {number} limit - Maximum number of tweets to retrieve
 * @returns {Promise<Object>} Stored tweets with metadata
 */
async function getStoredTweets(companyName, limit = 50, dateFilter = {}) {
  try {
    console.log(`📂 Fetching stored tweets for ${companyName} from database...`);
    
    const handle = TWITTER_HANDLES[companyName];
    if (!handle) {
      return {
        success: false,
        error: 'Company not configured for Twitter API',
        tweets: []
      };
    }

    // Build MongoDB query with date filter
    const query = { company: companyName };
    
    // Add date range filter if provided
    if (dateFilter.startDate || dateFilter.endDate) {
      query.createdAt = {};
      
      if (dateFilter.startDate) {
        query.createdAt.$gte = new Date(dateFilter.startDate);
        console.log(`📅 Filtering from: ${dateFilter.startDate}`);
      }
      
      if (dateFilter.endDate) {
        // Add 23:59:59 to end date to include the entire day
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
        console.log(`📅 Filtering until: ${dateFilter.endDate}`);
      }
    }

    // Fetch tweets from database, sorted by creation date (newest first)
    const storedTweets = await Tweet.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (storedTweets.length === 0) {
      return {
        success: true,
        tweets: [],
        handle,
        displayName: companyName,
        totalTweets: 0,
        message: 'No stored tweets found',
        fromDatabase: true
      };
    }

    // Format tweets for frontend
    const formattedTweets = storedTweets.map(tweet => ({
      id: tweet.tweetId,
      text: tweet.text,
      createdAt: tweet.createdAt,
      likes: tweet.metrics?.likes || 0,
      retweets: tweet.metrics?.retweets || 0,
      replies: tweet.metrics?.replies || 0,
      views: tweet.metrics?.views || 0,
      url: tweet.url,
      isRetweet: tweet.isRetweet,
      entities: tweet.entities || {},
      author: tweet.author,
      sentiment: tweet.sentiment,
      sentimentColor: tweet.sentimentColor,
      sentimentEmoji: tweet.sentimentEmoji,
      sentimentConfidence: tweet.sentimentConfidence,
      sentimentKeywords: {}
    }));

    // Calculate sentiment distribution
    const sentimentDistribution = {
      positive: formattedTweets.filter(t => t.sentiment === 'positive').length,
      negative: formattedTweets.filter(t => t.sentiment === 'negative').length,
      neutral: formattedTweets.filter(t => t.sentiment === 'neutral').length
    };

    // Calculate engagement metrics
    const totalEngagement = formattedTweets.reduce((sum, t) => 
      sum + t.likes + t.retweets + t.replies, 0
    );
    const avgEngagement = formattedTweets.length > 0 
      ? Math.round(totalEngagement / formattedTweets.length) 
      : 0;

    console.log(`✅ Found ${formattedTweets.length} stored tweets`);
    console.log(`📊 Sentiment: ${sentimentDistribution.positive} positive, ${sentimentDistribution.negative} negative, ${sentimentDistribution.neutral} neutral`);

    return {
      success: true,
      tweets: formattedTweets,
      handle,
      username: handle,
      displayName: companyName,
      totalTweets: formattedTweets.length,
      avgEngagement,
      sentimentDistribution,
      fetchedAt: new Date().toISOString(),
      fromDatabase: true,
      isAboutCompany: true
    };

  } catch (error) {
    console.error('❌ Error fetching stored tweets:', error.message);
    return {
      success: false,
      error: 'Failed to fetch stored tweets from database',
      tweets: [],
      companyName
    };
  }
}

module.exports = {
  getCompanyTweets,
  getCompanyHandle,
  getAvailableCompanies,
  clearCache,
  getStoredTweets
};
