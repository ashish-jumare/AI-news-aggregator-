import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import { API_ENDPOINTS } from '../config/api';

export default function LiveFeed({ company, filterDays, onNewsUpdate, cachedData, settingsVersion }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!company) return;

    // Use cached data if available
    if (cachedData && cachedData.length > 0) {
      console.log(' Using cached news data');
      setNews(cachedData);
      setLoading(false);
      setLastUpdate(new Date());
      return;
    }

    setLoading(true);
    setError(null);

    // Get maxArticles from settings (default 200)
    const savedSettings = localStorage.getItem('appSettings');
    const maxArticles = savedSettings ? JSON.parse(savedSettings).maxArticles || 200 : 200;

    console.log(` Fetching ${maxArticles} articles for ${company}...`);

    // Build SSE URL with optional filter and limit
    const filterParam = filterDays > 0 ? `&filterDays=${filterDays}` : '';
    const limitParam = `&limit=${maxArticles}`;
    const eventSource = new EventSource(
      `${API_ENDPOINTS.NEWS_LIVE}?company=${encodeURIComponent(company)}${filterParam}${limitParam}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log(' Connected to news stream');
        } else if (data.type === 'news') {
          setNews(data.data);
          if (onNewsUpdate) {
            onNewsUpdate(data.data);
          }
          setLastUpdate(new Date(data.timestamp));
          setLoading(false);
        } else if (data.type === 'error') {
          setError(data.message);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setError('Connection lost. Please refresh the page.');
      setLoading(false);
      eventSource.close();
    };

    // Cleanup on unmount or company change
    return () => {
      eventSource.close();
    };
  }, [company, filterDays, onNewsUpdate, cachedData, settingsVersion]);

  if (!company) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1.5">
          {company} News
        </h1>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Live Updates
          </span>
          {lastUpdate && (
            <span>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          {filterDays > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-semibold">
              📅 Last {filterDays === 30 ? '1 month' : filterDays === 90 ? '3 months' : filterDays === 180 ? '6 months' : '1 year'}
            </span>
          )}
        </div>
      </div>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto p-6 ">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading news...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-300">
            <p className="font-semibold"> Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No news articles found</p>
          </div>
        )}

        {!loading && !error && news.length > 0 && (
          <div className="space-y-3">
            {news.map((article, index) => (
              <NewsCard key={index} article={article} companyName={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
