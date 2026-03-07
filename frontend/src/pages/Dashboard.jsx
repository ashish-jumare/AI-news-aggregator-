import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard({ newsData = [], selectedCompany, onClose }) {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    totalNews: 0,
    positiveNews: 0,
    negativeNews: 0,
    neutralNews: 0,
    last24Hours: 0,
    topSources: []
  });

  useEffect(() => {
    if (newsData && newsData.length > 0) {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
      
      const last24HoursNews = newsData.filter(article => 
        new Date(article.publishedAt) >= twentyFourHoursAgo
      );

      const sentimentCounts = newsData.reduce((acc, article) => {
        const sentiment = article.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      }, {});

      const sourceCounts = newsData.reduce((acc, article) => {
        const source = article.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      const topSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([source, count]) => ({ source, count }));

      setStats({
        totalNews: newsData.length,
        positiveNews: sentimentCounts.positive || 0,
        negativeNews: sentimentCounts.negative || 0,
        neutralNews: sentimentCounts.neutral || 0,
        last24Hours: last24HoursNews.length,
        topSources
      });
    }
  }, [newsData]);

  const StatCard = ({ title, value, icon, color, percentage }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{value}</h3>
          {percentage && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              ↑ {percentage}% from last week
            </p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const sentimentPercentage = stats.totalNews > 0 
    ? {
        positive: ((stats.positiveNews / stats.totalNews) * 100).toFixed(1),
        negative: ((stats.negativeNews / stats.totalNews) * 100).toFixed(1),
        neutral: ((stats.neutralNews / stats.totalNews) * 100).toFixed(1)
      }
    : { positive: 0, negative: 0, neutral: 0 };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              📊 Analysis 
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Overview of all news
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to News
          </button>
        </div>

        {/* Company Name - Centered */}
        {selectedCompany && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              {selectedCompany}
            </h2>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Articles"
            value={stats.totalNews}
            icon="📰"
            color="bg-blue-100 dark:bg-blue-900/30"
            percentage={12}
          />
          <StatCard
            title="Last 24 Hours"
            value={stats.last24Hours}
            icon="⏱️"
            color="bg-purple-100 dark:bg-purple-900/30"
            percentage={8}
          />
          <StatCard
            title="Positive News"
            value={stats.positiveNews}
            icon="😊"
            color="bg-green-100 dark:bg-green-900/30"
            percentage={15}
          />
          <StatCard
            title="Negative News"
            value={stats.negativeNews}
            icon="😟"
            color="bg-red-100 dark:bg-red-900/30"
          />
          <StatCard
            title="Neutral News"
            value={stats.neutralNews}
            icon="😐"
            color="bg-gray-100 dark:bg-gray-700/30"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sentiment Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Sentiment Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Positive</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{sentimentPercentage.positive}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${sentimentPercentage.positive}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Negative</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{sentimentPercentage.negative}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${sentimentPercentage.negative}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Neutral</span>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{sentimentPercentage.neutral}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gray-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${sentimentPercentage.neutral}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Sources */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Top News Sources</h3>
            <div className="space-y-4">
              {stats.topSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{source.source}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{source.count} articles</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {newsData.slice(0, 5).map((article, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{article.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {article.sentiment && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    article.sentiment === 'positive' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : article.sentiment === 'negative'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {article.sentiment}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
