const { analyzeWithFinBERT, isFinBERTAvailable } = require('../services/finbertService');

// Simple sentiment analysis based on keywords
const positiveWords = [
  // Financial Growth & Profit
  'profit', 'gain', 'growth', 'revenue', 'earnings', 'dividend', 'returns', 'yield',
  'upside', 'rally', 'bullish', 'bull', 'breakout', 'boom', 'prosperity', 'rebound',
  
  // Success & Achievement
  'success', 'achievement', 'milestone', 'record', 'breakthrough', 'triumph', 'victory',
  'win', 'winning', 'award', 'recognition', 'excellence', 'accomplishment',
  
  // Performance & Quality
  'best', 'excellent', 'outstanding', 'superior', 'exceptional', 'remarkable',
  'impressive', 'strong', 'robust', 'solid', 'stellar', 'premium', 'top',
  
  // Progress & Improvement
  'advance', 'improve', 'upgrade', 'enhance', 'optimize', 'progress', 'development',
  'modernize', 'transform', 'revitalize', 'strengthen', 'reinforce',
  
  // Market Movement (Positive)
  'rise', 'surge', 'soar', 'climb', 'jump', 'spike', 'boost', 'increase', 'uptick',
  'upward', 'gain', 'recover', 'bounce', 'appreciation',
  
  // Business Expansion
  'expansion', 'launch', 'partnership', 'acquisition', 'merger', 'deal', 'contract',
  'collaboration', 'venture', 'opening', 'invest', 'investment', 'funding',
  
  // Innovation & Technology
  'innovation', 'innovative', 'pioneering', 'cutting-edge', 'revolutionary',
  'advanced', 'digital', 'automation', 'ai', 'smart', 'futuristic',
  
  // Positive Sentiment
  'positive', 'optimistic', 'confident', 'hopeful', 'promising', 'bright',
  'favorable', 'beneficial', 'advantageous', 'lucrative', 'profitable',
  
  // Leadership & Competitive Edge
  'lead', 'leader', 'leadership', 'dominant', 'competitive', 'advantage',
  'pioneering', 'frontrunner', 'market leader', 'outperform',
  
  // Approval & Support
  'approve', 'approval', 'endorse', 'support', 'backing', 'green light',
  'clearance', 'sanction', 'ratify', 'accept',
  
  // Growth Indicators
  'expand', 'scale', 'accelerate', 'momentum', 'thrive', 'flourish', 'prosper',
  'blooming', 'emerging', 'rising', 'growing'
];

const negativeWords = [
  // Financial Loss & Decline
  'loss', 'losses', 'decline', 'decrease', 'deficit', 'debt', 'liability',
  'shortfall', 'downturn', 'slump', 'bearish', 'bear', 'recession', 'depression',
  
  // Market Movement (Negative)
  'fall', 'drop', 'plunge', 'crash', 'tumble', 'dive', 'sink', 'collapse',
  'plummet', 'downward', 'slide', 'dip', 'depreciation', 'correction',
  
  // Failure & Problems
  'fail', 'failure', 'unsuccessful', 'setback', 'problem', 'issue', 'trouble',
  'difficulty', 'challenge', 'obstacle', 'hurdle', 'bottleneck', 'constraint',
  
  // Risk & Threat
  'risk', 'risky', 'threat', 'threaten', 'danger', 'vulnerable', 'exposure',
  'uncertainty', 'volatile', 'volatility', 'unstable', 'precarious',
  
  // Crisis & Emergency
  'crisis', 'emergency', 'critical', 'severe', 'serious', 'grave', 'dire',
  'alarm', 'alert', 'panic', 'chaos', 'turmoil', 'upheaval',
  
  // Legal & Regulatory Issues
  'lawsuit', 'litigation', 'sue', 'prosecution', 'investigation', 'probe',
  'inquiry', 'audit', 'scrutiny', 'violation', 'breach', 'fraud', 'scam',
  'scandal', 'misconduct', 'fine', 'penalty', 'sanction',
  
  // Negative Performance
  'worst', 'poor', 'weak', 'underperform', 'disappointing', 'lackluster',
  'subpar', 'inadequate', 'inferior', 'mediocre', 'struggling',
  
  // Warnings & Concerns
  'warning', 'caution', 'concern', 'worried', 'fear', 'doubt', 'skeptical',
  'pessimistic', 'gloomy', 'bleak', 'uncertain', 'questionable',
  
  // Business Setbacks
  'layoff', 'layoffs', 'cut', 'cuts', 'shutdown', 'closure', 'bankruptcy',
  'insolvency', 'liquidation', 'restructuring', 'downsize', 'firing',
  
  // Negative Sentiment
  'negative', 'bad', 'worse', 'worsen', 'deteriorate', 'damage', 'harm',
  'hurt', 'adverse', 'unfavorable', 'detrimental', 'damaging',
  
  // Competition & Market Share Loss
  'lose', 'losing', 'lost', 'abandon', 'exit', 'withdraw', 'retreat',
  'surrender', 'concede', 'outpaced', 'beaten',
  
  // Delays & Cancellations
  'delay', 'postpone', 'suspend', 'halt', 'cancel', 'cancellation',
  'discontinue', 'terminate', 'abort', 'abandon',
  
  // Quality Issues
  'defect', 'flaw', 'recall', 'malfunction', 'error', 'mistake',
  'bug', 'glitch', 'failure', 'breakdown', 'outage'
];

const neutralWords = [
  // Announcements & Communications
  'announce', 'announcement', 'statement', 'declare', 'report', 'reporting',
  'disclose', 'reveal', 'publish', 'release', 'issue', 'notify',
  
  // Meetings & Events
  'meeting', 'conference', 'summit', 'event', 'session', 'gathering',
  'webinar', 'presentation', 'discussion', 'dialogue', 'talk',
  
  // Updates & Changes
  'update', 'revision', 'change', 'modification', 'adjustment', 'amendment',
  'alter', 'shift', 'transition', 'move', 'transfer', 'relocate',
  
  // Planning & Strategy
  'plan', 'planning', 'strategy', 'strategic', 'initiative', 'program',
  'project', 'scheme', 'proposal', 'blueprint', 'roadmap', 'agenda',
  
  // Analysis & Research
  'analyze', 'analysis', 'study', 'research', 'review', 'examine',
  'evaluate', 'assess', 'survey', 'investigate', 'explore', 'monitor',
  
  // Data & Information
  'data', 'information', 'statistics', 'figures', 'numbers', 'metrics',
  'details', 'facts', 'insights', 'findings', 'results', 'outcome',
  
  // Forecasts & Projections
  'forecast', 'projection', 'estimate', 'prediction', 'outlook', 'expectation',
  'anticipate', 'foresee', 'predict', 'project', 'target', 'goal',
  
  // Operations & Processes
  'operate', 'operation', 'process', 'procedure', 'workflow', 'system',
  'mechanism', 'method', 'approach', 'practice', 'routine', 'standard',
  
  // Appointments & Roles
  'appoint', 'appointment', 'nominate', 'elect', 'designate', 'assign',
  'hire', 'recruit', 'onboard', 'join', 'joining', 'position', 'role',
  
  // Regulatory & Compliance
  'comply', 'compliance', 'regulation', 'regulatory', 'guideline', 'policy',
  'rule', 'standard', 'requirement', 'mandate', 'directive', 'framework',
  
  // Financial Neutrals
  'balance', 'stable', 'maintain', 'hold', 'neutral', 'unchanged',
  'steady', 'flat', 'level', 'consistent', 'regular', 'normal',
  
  // Time References
  'quarterly', 'annual', 'monthly', 'weekly', 'daily', 'fiscal',
  'year', 'quarter', 'period', 'term', 'duration', 'timeline',
  
  // General Business Terms
  'business', 'company', 'corporate', 'enterprise', 'organization', 'firm',
  'sector', 'industry', 'market', 'segment', 'division', 'department'
];

/**
 * Keyword-based sentiment analysis (Used for tweets)
 * @param {string} text - Text to analyze
 * @returns {string} - 'positive', 'negative', or 'neutral'
 */
const analyzeWithKeywords = (text) => {
  if (!text) return 'neutral';
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  neutralWords.forEach(word => {
    if (lowerText.includes(word)) neutralCount++;
  });

  // If strong neutral indicators present and no strong sentiment
  if (neutralCount > 3 && Math.abs(positiveCount - negativeCount) <= 1) {
    return 'neutral';
  }

  // Determine sentiment based on keyword counts
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

/**
 * Analyze sentiment for content (news articles use FinBERT, tweets use keywords)
 * @param {string} text - Text to analyze
 * @param {string} source - Type of content ('news' or 'tweet')
 * @returns {Promise<string>} - 'positive', 'negative', or 'neutral'
 */
const analyzeSentiment = async (text, source = 'news') => {
  if (!text) return 'neutral';

  // Use keyword-based for tweets (faster, good enough)
  if (source === 'tweet') {
    return analyzeWithKeywords(text);
  }

  // Use FinBERT for news articles (more accurate)
  if (source === 'news' && isFinBERTAvailable()) {
    try {
      const result = await analyzeWithFinBERT(text);
      
      if (result && result.sentiment) {
        return result.sentiment;
      }
    } catch (error) {
      console.log('  FinBERT analysis failed, using keyword fallback');
    }
  }

  // Fallback to keyword-based
  return analyzeWithKeywords(text);
};

/**
 * Batch analyze sentiment for multiple articles (much more efficient)
 * @param {Array} articles - Array of articles with title/description
 * @param {string} source - Type of content ('news' or 'tweet')
 * @returns {Promise<Array>} - Articles with sentiment added
 */
const analyzeSentimentBatch = async (articles, source = 'news') => {
  if (!articles || articles.length === 0) {
    return [];
  }

  // Use keyword-based for tweets
  if (source === 'tweet') {
    return articles.map(article => ({
      ...article,
      sentiment: analyzeWithKeywords(article.text || article.title || '')
    }));
  }

  // Use FinBERT batch processing for news (much faster than one-by-one)
  if (source === 'news' && isFinBERTAvailable()) {
    try {
      const { analyzeBatchWithFinBERT } = require('../services/finbertService');
      
      console.log(` Starting FinBERT batch analysis for ${articles.length} articles...`);
      const startTime = Date.now();
      
      // Extract texts from articles
      const texts = articles.map(article => {
        const text = (article.title || '') + ' ' + (article.description || '');
        return text.substring(0, 512); // Limit to 512 chars
      });
      
      // Batch analyze
      const results = await analyzeBatchWithFinBERT(texts);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(` FinBERT batch analysis completed in ${duration}s\n`);
      
      if (results && results.length === articles.length) {
        // Merge results with articles
        return articles.map((article, index) => {
          const result = results[index];
          
          if (result && result.sentiment) {
            return {
              ...article,
              sentiment: result.sentiment
            };
          } else {
            // Fallback to keywords for failed items
            return {
              ...article,
              sentiment: analyzeWithKeywords(article.title + ' ' + (article.description || ''))
            };
          }
        });
      } else {
        console.log('  FinBERT batch failed, falling back to keywords for all articles');
      }
    } catch (error) {
      console.error(' FinBERT batch error:', error.message);
      console.log('  Using keyword fallback for all articles');
    }
  }

  // Fallback: Use keywords for all
  console.log(` Using keyword-based analysis for ${articles.length} articles...`);
  return articles.map(article => ({
    ...article,
    sentiment: analyzeWithKeywords(article.title + ' ' + (article.description || ''))
  }));
};

module.exports = { 
  analyzeSentiment,
  analyzeSentimentBatch,
  analyzeWithKeywords 
};
