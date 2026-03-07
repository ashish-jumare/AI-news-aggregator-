import { useState } from 'react';
import Sidebar from './components/Sidebar';
import LiveFeed from './components/LiveFeed';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './pages/Dashboard';
import NewsFeedPage from './pages/NewsFeedPage';
import BookmarksPage from './pages/BookmarksPage';
import HelpSupportPage from './pages/HelpSupportPage';
import FeedbackPage from './pages/FeedbackPage';
import TwitterFeed from './components/TwitterFeed';
import HomePage from './pages/HomePage';
import LLMChatPage from './pages/LLMChatPage';

function App() {
  const [showHomePage, setShowHomePage] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [filterDays, setFilterDays] = useState(0); // 0 = All time, 30 = 1 month, 90 = 3 months, 180 = 6 months, 365 = 1 year
  const [currentNews, setCurrentNews] = useState([]);
  const [currentView, setCurrentView] = useState('news'); // 'news', 'twitter', 'dashboard', 'newsfeed', 'bookmarks', 'help', 'feedback'
  const [settingsVersion, setSettingsVersion] = useState(0); // Track settings changes
  const [showTweetOptionModal, setShowTweetOptionModal] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [tweetDateFilter, setTweetDateFilter] = useState({
    enabled: false,
    startDate: '',
    endDate: ''
  });
  
  // Cache for news data to prevent reload
  const [newsCache, setNewsCache] = useState({
    data: null,
    company: null,
    filterDays: null,
    timestamp: null
  });

  const handleViewChange = (view) => {
    if (view === 'twitter') {
      // Show option modal with date filter before opening Twitter feed
      setShowTweetOptionModal(true);
    } else {
      setCurrentView(view);
    }
  };

  const handleTweetOptionSelect = () => {
    setShowTweetOptionModal(false);
    setCurrentView('twitter');
    setFetchTrigger(prev => prev + 1); // Trigger refetch
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    if (currentView === 'twitter' || currentView === 'dashboard' || currentView === 'newsfeed' || currentView === 'bookmarks' || currentView === 'help' || currentView === 'feedback' || currentView === 'llm') {
      setCurrentView('news'); // Reset to news view when selecting new company
    }
  };

  // Update news cache when data is fetched
  const handleNewsUpdate = (data) => {
    setCurrentNews(data);
    setNewsCache({
      data: data,
      company: selectedCompany,
      filterDays: filterDays,
      timestamp: Date.now()
    });
  };

  // Handle settings change to trigger refetch
  const handleSettingsChange = () => {
    console.log('⚙️ Settings changed, clearing cache and refreshing...');
    // Clear cache to force refetch
    setNewsCache({
      data: null,
      company: null,
      filterDays: null,
      timestamp: null
    });
    // Increment version to trigger useEffect in LiveFeed
    setSettingsVersion(prev => prev + 1);
  };

  // Check if we have valid cached data
  const shouldUseCachedNews = () => {
    if (!newsCache.data) return false;
    if (newsCache.company !== selectedCompany) return false;
    if (newsCache.filterDays !== filterDays) return false;
    
    // Cache valid for 5 minutes
    const cacheAge = Date.now() - newsCache.timestamp;
    return cacheAge < 5 * 60 * 1000;
  };

  // Show HomePage if user hasn't started
  if (showHomePage) {
    return (
      <HomePage 
        onGetStarted={() => {
          setShowHomePage(false);
          setCurrentView('news');
        }}
        onOpenHelp={() => {
          setShowHomePage(false);
          setCurrentView('help');
        }}
        onOpenFeedback={() => {
          setShowHomePage(false);
          setCurrentView('feedback');
        }}
        onOpenLLM={() => {
          setShowHomePage(false);
          setCurrentView('llm');
        }}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {currentView === 'dashboard' ? (
        <Dashboard 
          newsData={currentNews} 
          selectedCompany={selectedCompany}
          onClose={() => setCurrentView('news')}
        />
      ) : currentView === 'newsfeed' ? (
        <NewsFeedPage
          newsData={currentNews}
          selectedCompany={selectedCompany}
          onClose={() => setCurrentView('news')}
        />
      ) : currentView === 'bookmarks' ? (
        <BookmarksPage
          onClose={() => setCurrentView('news')}
        />
      ) : currentView === 'help' ? (
        <HelpSupportPage
          onClose={() => setShowHomePage(true)}
        />
      ) : currentView === 'feedback' ? (
        <FeedbackPage
          onClose={() => setShowHomePage(true)}
        />
      ) : currentView === 'llm' ? (
        <LLMChatPage
          onClose={() => setShowHomePage(true)}
        />
      ) : (
        <>
          <ThemeToggle 
            newsData={currentNews} 
            selectedCompany={selectedCompany}
            onOpenDashboard={() => handleViewChange('dashboard')}
            onOpenNewsFeed={() => handleViewChange('newsfeed')}
            onOpenTwitterFeed={() => handleViewChange('twitter')}
            onOpenBookmarks={() => handleViewChange('bookmarks')}
            onOpenHelp={() => handleViewChange('help')}
            onOpenFeedback={() => handleViewChange('feedback')}
            onSettingsChange={handleSettingsChange}
            onGoHome={() => setShowHomePage(true)}
            currentView={currentView}
          />
          <Sidebar
            selectedCompany={selectedCompany}
            onSelectCompany={handleCompanySelect}
            filterDays={filterDays}
            onFilterChange={setFilterDays}
          />
          <main className="flex-1 overflow-hidden">
            {currentView === 'twitter' ? (
              <TwitterFeed
                companyName={selectedCompany}
                onClose={() => setCurrentView('news')}
                dateFilter={tweetDateFilter}
                fetchTrigger={fetchTrigger}
              />
            ) : selectedCompany ? (
              <LiveFeed
                company={selectedCompany}
                filterDays={filterDays}
                onNewsUpdate={handleNewsUpdate}
                cachedData={shouldUseCachedNews() ? newsCache.data : null}
                settingsVersion={settingsVersion}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                    📰 Live Company News
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Select a company from the sidebar to view live news
                  </p>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* Tweet Filter Modal */}
      {showTweetOptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-scaleIn">
            {/* Close Button */}
            <button
              onClick={() => setShowTweetOptionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Filter Tweets
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Set date range for <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedCompany}</span>
              </p>
            </div>

            {/* Date Filter Section */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <label className="text-sm font-bold text-gray-900 dark:text-white">Date Range</label>
              </div>
              
              {/* Enable Date Filter Toggle */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setTweetDateFilter(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    tweetDateFilter.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      tweetDateFilter.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {tweetDateFilter.enabled ? 'Date filter enabled' : 'Show all available tweets'}
                </span>
              </div>

              {/* Date Range Inputs */}
              {tweetDateFilter.enabled && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={tweetDateFilter.startDate}
                      onChange={(e) => setTweetDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={tweetDateFilter.endDate}
                      onChange={(e) => setTweetDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      min={tweetDateFilter.startDate}
                      className="w-full px-4 py-2.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Date Filter Info */}
              <div className="mt-4 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {tweetDateFilter.enabled 
                    ? 'Tweets will be filtered by the selected date range.' 
                    : 'Toggle on to filter tweets by date range.'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowTweetOptionModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleTweetOptionSelect}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                View Tweets
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>


          </div>
        </div>
      )}
    </div>
  );
}

export default App;
