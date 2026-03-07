import { useState } from 'react';

export default function HelpSupportPage({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // FAQ Data organized by categories
  const faqData = [
    {
      category: 'news',
      categoryName: ' News Feed',
      questions: [
        {
          id: 'news-1',
          question: 'How do I filter news by company?',
          answer: 'Select any company from the left sidebar. The news feed will automatically update to show articles specific to that company. You can also use the time filter dropdown in the sidebar to view news from specific periods (1 month, 3 months, 6 months, or 1 year).'
        },
        {
          id: 'news-2',
          question: 'What news sources do you use?',
          answer: 'We aggregate news from Google News RSS feeds, which includes multiple reputable sources like Economic Times, Business Standard, Financial Express, Mint, and other major business news outlets. All news is fetched in real-time using Server-Sent Events (SSE).'
        },
        {
          id: 'news-3',
          question: 'How often is news updated?',
          answer: 'News is updated in real-time using live streaming technology (SSE). When you select a company, the feed automatically refreshes every 60 seconds. You can see the "Live Updates" indicator with a green pulsing dot in the header showing the last update time.'
        },
        {
          id: 'news-4',
          question: 'How do I bookmark articles?',
          answer: 'Click the bookmark icon on any article card. Bookmarked articles are saved in your browser and can be accessed anytime from the Bookmarks section in the menu. You can filter, sort, and manage all your bookmarks there.'
        },
        {
          id: 'news-5',
          question: 'What does sentiment analysis mean?',
          answer: 'Sentiment analysis shows whether an article has a Positive (😊), Negative (😟), or Neutral (😐) tone. It\'s calculated using keyword analysis that identifies positive words (growth, profit, success) vs negative words (loss, decline, issue). This helps you quickly understand the overall tone of the news.'
        },
        {
          id: 'news-6',
          question: 'Can I search for specific topics or keywords?',
          answer: 'Currently, you can search for companies using the search box in the sidebar. Once you select a company, all news articles related to that company will be displayed. Future updates will include keyword search across articles.'
        },
        {
          id: 'news-7',
          question: 'How many companies are tracked?',
          answer: 'We track all 100 companies in the NIFTY 100 index, including major players like Reliance, TCS, Infosys, HDFC Bank, ICICI Bank, and many more. Use the search box in the sidebar to quickly find any company.'
        }
      ]
    },
    {
      category: 'twitter',
      categoryName: ' Twitter Feed',
      questions: [
        {
          id: 'twitter-1',
          question: 'Which companies have live Twitter API integration?',
          answer: 'The top 10 companies use Twitter API v2 for real-time tweets with sentiment analysis: Reliance Industries, TCS, Infosys, HDFC Bank, ICICI Bank, Bharti Airtel, State Bank of India, Hindustan Unilever, ITC, and Larsen & Toubro. These show a "✨ Live API" badge.'
        },
        {
          id: 'twitter-2',
          question: 'What\'s the difference between API and widget mode?',
          answer: 'API Mode (top 10 companies): Shows tweets with sentiment analysis (Positive/Negative/Neutral), displays engagement metrics, and includes a sentiment overview dashboard. Widget Mode (other companies): Shows embedded Twitter timeline directly from X/Twitter without sentiment analysis.'
        },
        {
          id: 'twitter-3',
          question: 'Why am I seeing "Rate Limit Reached" error?',
          answer: 'Twitter Free API allows only 15 requests per 15 minutes. If you refresh too quickly or view multiple companies rapidly, you\'ll hit this limit. Solution: Wait 5-15 minutes before trying again. Tweets are cached for 5 minutes to reduce API calls.'
        },
        {
          id: 'twitter-4',
          question: 'How is Twitter sentiment calculated?',
          answer: 'Tweet sentiment is analyzed using keyword matching. Positive keywords (excellent, great, growth, success) score +1, negative keywords (poor, decline, loss, concern) score -1. The overall sentiment is determined by the keyword count. Confidence percentage shows how strong the sentiment is.'
        },
        {
          id: 'twitter-5',
          question: 'Why can\'t I see some tweets?',
          answer: 'This could be due to: 1) Rate limit reached (wait 15 minutes), 2) Company hasn\'t posted recently, 3) Twitter account privacy settings, or 4) Network connectivity issues. Try refreshing after a few minutes or check the Twitter handle directly.'
        },
        {
          id: 'twitter-6',
          question: 'How do I view tweets on Twitter/X directly?',
          answer: 'Click the "🔗 Open in X" button in the Twitter feed header to view the company\'s Twitter profile directly on twitter.com/X.com. This opens in a new tab and shows the complete timeline.'
        }
      ]
    },
    {
      category: 'settings',
      categoryName: ' Settings & Features',
      questions: [
        {
          id: 'settings-1',
          question: 'How do I switch between dark and light mode?',
          answer: 'Click the sun/moon icon in the top-right corner to toggle themes. Your preference is saved automatically. Dark mode is easier on the eyes in low-light conditions, while light mode works better in bright environments.'
        },
        {
          id: 'settings-2',
          question: 'How do I enable notifications?',
          answer: 'Go to Menu → Settings → Notifications tab. Toggle "Enable Notifications" master switch, then customize: Email Notifications, Push Notifications, New Article Alerts, and Sentiment Change Alerts. Settings are saved automatically.'
        },
        {
          id: 'settings-3',
          question: 'What is cache duration and how do I adjust it?',
          answer: 'Cache stores data temporarily to improve performance and reduce API calls. Go to Settings → Data & Privacy → Cache Duration. Choose from 1, 5, 10, 30, or 60 minutes. Shorter duration = fresher data but more API calls. Recommended: 5-10 minutes.'
        },
        {
          id: 'settings-4',
          question: 'How do I reset all settings to default?',
          answer: 'Go to Menu → Settings, scroll to the bottom, and click "Reset to Defaults" button. Confirm the action. This will restore: Auto-refresh (enabled), Refresh interval (5 min), Articles per page (20), Theme (system), and all other settings to their original values.'
        },
        {
          id: 'settings-5',
          question: 'Can I change the language?',
          answer: 'Yes! Go to Settings → General → Language. Select from English, Hindi (हिंदी), Marathi (मराठी), Tamil (தமிழ்), or Telugu (తెలుగు). Note: Language support is currently limited to UI elements; news articles remain in their original language.'
        },
        {
          id: 'settings-6',
          question: 'How many articles are shown per page?',
          answer: 'Default is 20 articles per page. You can change this in Settings → General → Articles per Page. Choose from 10, 20, 50, or 100. Lower numbers load faster, higher numbers reduce scrolling. Recommended: 20-50 articles.'
        }
      ]
    },
    {
      category: 'reports',
      categoryName: ' Reports & Export',
      questions: [
        {
          id: 'reports-1',
          question: 'How do I generate PDF reports?',
          answer: 'Click the "Generate Report" button (top navigation) → Select "Download PDF Report" → Choose time period (24 hours, 1 month, or 3 months) → Click Download. PDF includes company overview, executive summary, sentiment analysis, and detailed article list with thumbnails.'
        },
        {
          id: 'reports-2',
          question: 'How do I export data to Excel?',
          answer: 'Click "Generate Report" → Select "Download Excel Summary" → Choose time period → Click Download. Excel file includes 3 sheets: News List (all articles with details), Sentiment Analysis (positive/negative/neutral breakdown), and Executive Summary (key insights).'
        },
        {
          id: 'reports-3',
          question: 'What data is included in reports?',
          answer: 'Reports include: Article titles, descriptions, publication dates, sources, sentiment scores, links, company name, executive summary, sentiment distribution charts, time period analyzed, total article count, and key insights. Excel also includes structured data for further analysis.'
        },
        {
          id: 'reports-4',
          question: 'Can I schedule automatic reports?',
          answer: 'Automatic scheduling is not currently available but is planned for a future update. Currently, you can manually generate reports anytime for any time period. Use the quick access buttons to download 24-hour, 1-month, or 3-month reports.'
        },
        {
          id: 'reports-5',
          question: 'Why is my PDF export failing?',
          answer: 'Common reasons: 1) Browser blocked the download (check popup blocker), 2) Too many articles (try shorter time period), 3) Network issue during generation. Try: Allow popups from this site, select shorter time period (24h instead of 3 months), or check your internet connection.'
        }
      ]
    },
    {
      category: 'bookmarks',
      categoryName: ' Bookmarks',
      questions: [
        {
          id: 'bookmarks-1',
          question: 'How do I save articles to bookmarks?',
          answer: 'Click the bookmark icon on any article card. The icon fills in when saved. All bookmarks are stored in your browser\'s local storage and persist across sessions. Access them anytime from Menu → Bookmarks.'
        },
        {
          id: 'bookmarks-2',
          question: 'How do I organize my bookmarks?',
          answer: 'In the Bookmarks page: Use Filter dropdown (All Time/Today/This Week/This Month) to view bookmarks by time. Use Sort dropdown (Most Recent/Oldest First/By Company) to organize. Bookmarks show company name, source, published date, and when you bookmarked them.'
        },
        {
          id: 'bookmarks-3',
          question: 'Can I remove bookmarks?',
          answer: 'Yes! Two ways: 1) Click the filled bookmark icon on any article to remove it, 2) In Bookmarks page, click the remove button (filled bookmark icon) on individual bookmarks. Use "Clear All" button to remove all bookmarks at once (confirmation required).'
        },
        {
          id: 'bookmarks-4',
          question: 'Are my bookmarks backed up?',
          answer: 'Bookmarks are stored in your browser\'s local storage, not on a server. They persist on the same device/browser but are NOT synced across devices. Clearing browser data will delete bookmarks. Recommendation: Periodically export important articles as PDF/Excel for backup.'
        }
      ]
    }
  ];

  // Flatten all questions for search
  const allQuestions = faqData.flatMap(category => 
    category.questions.map(q => ({
      ...q,
      category: category.category,
      categoryName: category.categoryName
    }))
  );

  // Filter questions based on search and category
  const getFilteredQuestions = () => {
    let filtered = allQuestions;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(q => q.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) || 
        q.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredQuestions = getFilteredQuestions();

  // Toggle FAQ expansion
  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // Category buttons
  const categories = [
    { id: 'all', name: 'All Topics'},
    { id: 'news', name: 'News Feed'},
    { id: 'twitter', name: 'Twitter'},
    { id: 'analytics', name: 'Analytics'},
    { id: 'settings', name: 'Settings'},
    { id: 'reports', name: 'Reports'},
    { id: 'bookmarks', name: 'Bookmarks'}
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help & Support
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Find answers to frequently asked questions
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

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for answers... (e.g., 'How to bookmark articles?')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-base text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <label className="text-base font-medium text-gray-700 dark:text-gray-300">Category:</label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[250px]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                No Results Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md text-base">
                No questions match your search "{searchQuery}". Try different keywords or browse by category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Count */}
              <div className="text-gray-600 dark:text-gray-400 text-base mb-6">
                Showing <span className="font-semibold text-gray-800 dark:text-white">{filteredQuestions.length}</span> {filteredQuestions.length === 1 ? 'question' : 'questions'}
                {searchQuery && <span> for "<span className="font-semibold text-blue-600 dark:text-blue-400">{searchQuery}</span>"</span>}
              </div>

              {/* FAQ Accordion */}
              {filteredQuestions.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-8 py-6 flex items-start justify-between text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{faq.categoryName.split(' ')[0]}</span>
                        <span className="text-xs font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                          {faq.categoryName.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white leading-relaxed">
                        {faq.question}
                      </h3>
                    </div>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      expandedFAQ === faq.id 
                        ? 'bg-blue-600 text-white rotate-180' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Answer */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedFAQ === faq.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-8 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                      
                      {/* Was this helpful */}
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Was this helpful?</span>
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            Yes
                          </button>
                          <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            No
                          </button>
                        </div>
                      </div>
                    </div>
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
