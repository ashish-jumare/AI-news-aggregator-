import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import NewsCard from '../components/NewsCard';

export default function NewsFeedPage({ newsData = [], selectedCompany, onClose }) {
  const { isDark } = useTheme();
  const [filteredNews, setFilteredNews] = useState([]);
  const [sortBy, setSortBy] = useState('latest'); // latest, oldest, sentiment
  const [filterSentiment, setFilterSentiment] = useState('all'); // all, positive, negative, neutral
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let filtered = [...newsData];

    // Filter by sentiment
    if (filterSentiment !== 'all') {
      filtered = filtered.filter(article => article.sentiment === filterSentiment);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort
    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    } else if (sortBy === 'sentiment') {
      const sentimentOrder = { positive: 0, neutral: 1, negative: 2 };
      filtered.sort((a, b) => sentimentOrder[a.sentiment || 'neutral'] - sentimentOrder[b.sentiment || 'neutral']);
    }

    setFilteredNews(filtered);
  }, [newsData, sortBy, filterSentiment, searchQuery]);

  const sentimentCounts = newsData.reduce((acc, article) => {
    const sentiment = article.sentiment || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 w-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                📰 News Feed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedCompany ? `Latest news for ${selectedCompany}` : 'All company news'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{newsData.length}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">😊 Positive:</span>
              <span className="text-sm font-bold text-green-900 dark:text-green-300">{sentimentCounts.positive}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">😟 Negative:</span>
              <span className="text-sm font-bold text-red-900 dark:text-red-300">{sentimentCounts.negative}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">😐 Neutral:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{sentimentCounts.neutral}</span>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white font-medium"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="sentiment">By Sentiment</option>
            </select>

            {/* Filter Sentiment */}
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white font-medium"
            >
              <option value="all">All Sentiment</option>
              <option value="positive">😊 Positive</option>
              <option value="negative">😟 Negative</option>
              <option value="neutral">😐 Neutral</option>
            </select>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-8 py-6">
        {filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((article, index) => (
              <NewsCard key={index} article={article} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96">
            <svg className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No news found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search query</p>
          </div>
        )}

        {/* Results Info */}
        {filteredNews.length > 0 && (
          <div className="max-w-7xl mx-auto px-8 pb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Showing {filteredNews.length} of {newsData.length} articles
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
