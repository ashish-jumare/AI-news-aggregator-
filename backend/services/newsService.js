const axios = require('axios');
const cheerio = require('cheerio');

// Helper to get relative time string
const getRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Scrape Google News RSS feed as primary source (real-time, no delay)
const scrapeGoogleNews = async (company, limit = 200) => {
  try {
    console.log(`🕷️ Scraping multiple RSS feeds for: ${company} (limit: ${limit})`);
    
    const allArticles = [];
    
    // Multiple RSS sources for comprehensive coverage
    const rssSources = [
      // Google News - General company news
      {
        name: 'Google News',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(company)}&hl=en-IN&gl=IN&ceid=IN:en`
      },
      // Google News - Stock market news
      {
        name: 'Google News Stock',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(company + ' stock market')}&hl=en-IN&gl=IN&ceid=IN:en`
      },
      // Google News - Business news
      {
        name: 'Google News Business',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(company + ' business')}&hl=en-IN&gl=IN&ceid=IN:en`
      },
      // Google News - Financial news
      {
        name: 'Google News Finance',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(company + ' finance')}&hl=en-IN&gl=IN&ceid=IN:en`
      }
    ];
    
    for (const source of rssSources) {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data, { xmlMode: true });
        
        $('item').each((index, element) => {
          try {
            const title = $(element).find('title').text().trim();
            const link = $(element).find('link').text().trim();
            const pubDate = $(element).find('pubDate').text().trim() || $(element).find('published').text().trim();
            let description = $(element).find('description').text().trim() || $(element).find('summary').text().trim();
            const sourceTag = $(element).find('source').text().trim() || source.name;

            // Clean HTML tags from description
            if (description) {
              // Load the description as HTML to strip tags
              const descHtml = cheerio.load(description);
              description = descHtml.text().trim();
              // Remove extra whitespace
              description = description.replace(/\s+/g, ' ');
            }

            if (title && link) {
              const publishedDate = pubDate ? new Date(pubDate) : new Date();
              const timeAgo = getRelativeTime(publishedDate);

              // Check for duplicates by URL or title
              if (!allArticles.some(a => a.url === link || a.title === title)) {
                allArticles.push({
                  title,
                  description: description ? description.substring(0, 200) + '...' : title.substring(0, 100) + '...',
                  source: sourceTag,
                  url: link,
                  publishedAt: publishedDate.toISOString(),
                  urlToImage: null
                });
              }
            }
          } catch (err) {
            console.log(`⚠️ Error parsing article from ${source.name}: ${err.message}`);
          }
        });
        
        console.log(` ${source.name}: ${allArticles.filter(a => a.source === source.name).length} articles fetched`);
        
        // Stop if we have enough articles
        if (allArticles.length >= limit) break;
        
      } catch (err) {
        console.log(` ${source.name} failed: ${err.message}`);
      }
    }

    // Limit to requested number of articles and sort by date
    const articles = allArticles
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    if (articles.length === 0) {
      console.log(' No articles found in RSS feed');
      throw new Error('No articles found in Google News RSS');
    }

    console.log(` Scraper found ${articles.length} real-time articles for ${company}`);
    return articles;

  } catch (error) {
    console.error(` Google News RSS scraping error: ${error.message}`);
    throw new Error(`Failed to scrape Google News RSS: ${error.message}`);
  }
};

// Fetch news from NewsAPI.org as fallback (24hr delay on free tier)
const fetchNewsFromAPI = async (company) => {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey || apiKey === 'your_newsapi_key_here') {
    throw new Error('NEWS_API_KEY not configured. Get one from https://newsapi.org/');
  }

  const url = `https://newsapi.org/v2/everything`;
  
  const response = await axios.get(url, {
    params: {
      q: company,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: 100,
      apiKey: apiKey
    }
  });

  if (response.data.status !== 'ok') {
    throw new Error('News API request failed');
  }

  console.log(` News API returned ${response.data.articles.length} articles for ${company} (24hr delay on free tier)`);

  return response.data.articles.map(article => ({
    title: article.title,
    description: article.description,
    url: article.url,
    source: article.source.name,
    publishedAt: article.publishedAt,
    urlToImage: article.urlToImage
  }));
};

module.exports = { scrapeGoogleNews, fetchNewsFromAPI };
