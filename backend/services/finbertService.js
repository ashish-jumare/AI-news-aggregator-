const axios = require('axios');

const FINBERT_API_URL = process.env.FINBERT_API_URL || 'http://localhost:5001';

// Cache for FinBERT availability
let finbertAvailable = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds

/**
 * Check if FinBERT service is available
 * @returns {Promise<boolean>}
 */
async function checkFinBERTAvailability() {
  const now = Date.now();
  
  // Return cached result if checked recently
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return finbertAvailable;
  }
  
  try {
    const response = await axios.get(`${FINBERT_API_URL}/health`, {
      timeout: 5000
    });
    
    finbertAvailable = response.data.ml_model_loaded === true;
    lastHealthCheck = now;
    
    return finbertAvailable;
  } catch (error) {
    finbertAvailable = false;
    lastHealthCheck = now;
    return false;
  }
}

/**
 * Analyze sentiment using FinBERT ML model
 * @param {string} text - Text to analyze
 * @returns {Promise<{sentiment: string, confidence: number, scores: object} | null>}
 */
async function analyzeWithFinBERT(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }
  
  try {
    const response = await axios.post(
      `${FINBERT_API_URL}/analyze`,
      { text: text },
      { 
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return {
      sentiment: response.data.sentiment,
      confidence: response.data.confidence,
      scores: response.data.scores,
      method: 'finbert'
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(' FinBERT service not running on', FINBERT_API_URL);
    } else {
      console.error(' FinBERT API error:', error.message);
    }
    return null;
  }
}

/**
 * Analyze multiple texts in batch
 * @param {string[]} texts - Array of texts
 * @returns {Promise<Array | null>}
 */
async function analyzeBatchWithFinBERT(texts) {
  if (!texts || texts.length === 0) {
    return null;
  }
  
  // Split into chunks of 50 for better performance and timeout handling
  const chunkSize = 50;
  const chunks = [];
  
  for (let i = 0; i < texts.length; i += chunkSize) {
    chunks.push(texts.slice(i, i + chunkSize));
  }
  
  console.log(` Processing ${texts.length} texts in ${chunks.length} batches (${chunkSize} per batch)...`);
  
  const allResults = [];
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`    Processing batch ${i + 1}/${chunks.length} (${chunk.length} items)...`);
    
    try {
      const response = await axios.post(
        `${FINBERT_API_URL}/analyze-batch`,
        { texts: chunk },
        { 
          timeout: 60000, // 60 seconds per batch
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const results = response.data.results.map(result => ({
        sentiment: result.sentiment,
        confidence: result.confidence,
        scores: result.scores,
        method: 'finbert'
      }));
      
      allResults.push(...results);
      console.log(`    Batch ${i + 1}/${chunks.length} completed`);
    } catch (error) {
      console.error(`    Batch ${i + 1}/${chunks.length} failed:`, error.message);
      // Add null results for failed batch so array indices match
      allResults.push(...chunk.map(() => null));
    }
  }
  
  return allResults;
}

/**
 * Initialize FinBERT service connection
 */
async function initializeFinBERT() {
  console.log(' Checking FinBERT service availability...');
  
  const available = await checkFinBERTAvailability();
  
  if (available) {
    console.log(' FinBERT ML model is available at', FINBERT_API_URL);
    console.log(' News articles will use FinBERT for sentiment analysis');
  } else {
    console.log('  FinBERT service not available, using keyword-based sentiment');
    console.log(' Start FinBERT service: cd ml_model && python sentiment_service.py');
  }
  
  return available;
}

module.exports = {
  analyzeWithFinBERT,
  analyzeBatchWithFinBERT,
  checkFinBERTAvailability,
  initializeFinBERT,
  isFinBERTAvailable: () => finbertAvailable
};
