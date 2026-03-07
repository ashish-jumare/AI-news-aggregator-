import { useState, useEffect } from 'react';
import { getBookmarks, removeBookmark, clearAllBookmarks } from '../services/bookmarkService';

export default function BookmarksPage({ onClose }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'oldest', 'company'

  // Load bookmarks from MongoDB on mount
  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await getBookmarks();
      setBookmarks(response.bookmarks || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove a bookmark
  const handleRemoveBookmark = async (url) => {
    try {
      await removeBookmark(url);
      setBookmarks(bookmarks.filter(b => b.url !== url));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      alert('Failed to remove bookmark. Please try again.');
    }
  };

  // Clear all bookmarks
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all bookmarks? This action cannot be undone.')) {
      try {
        await clearAllBookmarks();
        setBookmarks([]);
      } catch (error) {
        console.error('Error clearing bookmarks:', error);
        alert('Failed to clear bookmarks. Please try again.');
      }
    }
  };

  // Filter bookmarks by time
  const getFilteredBookmarks = () => {
    const now = new Date();
    let filtered = [...bookmarks];

    if (filter === 'today') {
      filtered = filtered.filter(b => {
        const bookmarkDate = new Date(b.bookmarkedAt);
        return bookmarkDate.toDateString() === now.toDateString();
      });
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(b => new Date(b.bookmarkedAt) >= weekAgo);
    } else if (filter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(b => new Date(b.bookmarkedAt) >= monthAgo);
    }

    // Sort bookmarks
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.bookmarkedAt) - new Date(b.bookmarkedAt));
    } else if (sortBy === 'company') {
      filtered.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
    }

    return filtered;
  };

  const filteredBookmarks = getFilteredBookmarks();

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Bookmarked Articles
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                {bookmarks.length} saved article{bookmarks.length !== 1 ? 's' : ''}
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Time Filter */}
              <div className="flex items-center gap-3">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">Filter:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="company">By Company</option>
                </select>
              </div>
            </div>

            {/* Clear All Button */}
            {bookmarks.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-5 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-base font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[500px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Loading bookmarks...</p>
              </div>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
              <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-8">
                <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                {bookmarks.length === 0 ? 'No Bookmarks Yet' : 'No Bookmarks Match Filter'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl text-lg leading-relaxed">
                {bookmarks.length === 0 
                  ? 'Start bookmarking articles to save them for later. Click the bookmark icon on any article to add it here.'
                  : 'Try adjusting your filter to see more bookmarks.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark._id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all duration-300"
                >
                  {/* Article Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 pr-6">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight">
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                          {bookmark.title}
                        </a>
                      </h3>
                      
                      <div className="flex items-center gap-4 text-base text-gray-600 dark:text-gray-400 mb-4">
                        {bookmark.company && (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {bookmark.company}
                          </span>
                        )}
                        
                        {bookmark.source && (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            {bookmark.source}
                          </span>
                        )}
                        
                        {bookmark.publishedAt && (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(bookmark.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>

                      {bookmark.description && (
                        <p className="text-gray-700 dark:text-gray-300 text-base line-clamp-3 mb-4 leading-relaxed">
                          {bookmark.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Bookmarked on {new Date(bookmark.bookmarkedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveBookmark(bookmark.url)}
                      className="ml-4 p-3 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Remove bookmark"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>

                  {/* Article Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Read Article
                    </a>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bookmark.url);
                        alert('Link copied to clipboard!');
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors text-base font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
