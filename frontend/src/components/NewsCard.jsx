import { useState, useEffect } from 'react';
import { addBookmark, removeBookmark, checkBookmark } from '../services/bookmarkService';

export default function NewsCard({ article, companyName }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if article is bookmarked on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const result = await checkBookmark(article.url);
        setIsBookmarked(result.isBookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };
    checkBookmarkStatus();
  }, [article.url]);

  // Toggle bookmark
  const toggleBookmark = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark from MongoDB
        await removeBookmark(article.url);
        setIsBookmarked(false);
      } else {
        // Add bookmark to MongoDB
        const bookmarkData = {
          company: companyName || article.company || 'Unknown',
          title: article.title,
          description: article.description || '',
          url: article.url,
          source: article.source || 'Unknown',
          publishedAt: article.publishedAt,
          sentiment: article.sentiment || 'neutral',
          urlToImage: article.urlToImage || null
        };
        await addBookmark(bookmarkData);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert(error.response?.data?.message || 'Failed to update bookmark. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      default:
        return '😐';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Format exact date and time with accurate AM/PM
    const dateOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const dateStr = date.toLocaleDateString('en-US', dateOptions);
    const timeStr = date.toLocaleTimeString('en-US', timeOptions);
    const exactTime = `${dateStr} at ${timeStr}`;

    // Relative time for quick reference
    let relativeTime = '';
    if (diffMins < 1) {
      relativeTime = 'Just now';
    } else if (diffMins < 60) {
      relativeTime = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    } else {
      relativeTime = `${diffDays}d ago`;
    }

    return { exactTime, relativeTime };
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        {/* Title and Sentiment */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-bold text-gray-800 dark:text-white flex-1 mr-3 line-clamp-2">
            {article.title}
          </h3>
          {article.sentiment && (
            <span
              className={`flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getSentimentColor(
                article.sentiment
              )}`}
            >
              <span className="mr-1">{getSentimentEmoji(article.sentiment)}</span>
              {article.sentiment}
            </span>
          )}
        </div>

        {/* Additional Context */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          <span className="font-medium">Additional Context:</span> Reported by {article.source}. Published {formatTime(article.publishedAt).relativeTime.toLowerCase()}. 
          {article.sentiment === 'positive' && ' Indicates positive market sentiment and potential growth opportunities.'}
          {article.sentiment === 'negative' && ' Presents challenges and potential negative market implications.'}
          {article.sentiment === 'neutral' && ' Presents balanced market outlook with mixed implications.'}
        </p>

        {/* Image */}
        {article.urlToImage && (
          <div className="mb-3 rounded-md overflow-hidden">
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-32 object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">{article.source}</span>
              <span>•</span>
              <span className="text-primary dark:text-blue-400 font-semibold">{formatTime(article.publishedAt).relativeTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">🕐</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {formatTime(article.publishedAt).exactTime}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Read Article Link */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
            >
              Read
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>

            {/* Bookmark Button */}
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            >
              <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
