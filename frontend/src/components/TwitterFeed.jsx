import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export default function TwitterFeed({ companyName, onClose, dateFilter, fetchTrigger }) {
  const [tweets, setTweets] = useState([]);
  const [storedTweets, setStoredTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStored, setLoadingStored] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [useAPI, setUseAPI] = useState(true);
  const [showingStored, setShowingStored] = useState(false);
  
  // Pagination and deduplication tracking
  const [nextToken, setNextToken] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [shownTweetIds, setShownTweetIds] = useState(new Set());
  const [shownAuthorIds, setShownAuthorIds] = useState(new Set());

  // Top 10 companies that use API instead of widget
  const API_ENABLED_COMPANIES = [
    'Reliance Industries Ltd.',
    'Tata Consultancy Services Ltd.',
    'Infosys Ltd.',
    'HDFC Bank Ltd.',
    'ICICI Bank Ltd.',
    'Bharti Airtel Ltd.',
    'State Bank of India',
    'Hindustan Unilever Ltd.',
    'ITC Ltd.',
    'Larsen & Toubro Ltd.'
  ];

  // Comprehensive and accurate Twitter handle mapping for NIFTY 100 companies
  const handles = {
    // Top 10 Companies
    'Reliance Industries Ltd.': 'RIL_Updates',
    'Tata Consultancy Services Ltd.': 'TCS_News',
    'HDFC Bank Ltd.': 'HDFC_Bank',
    'Infosys Ltd.': 'Infosys',
    'ICICI Bank Ltd.': 'ICICIBank',
    'Bharti Airtel Ltd.': 'airtelindia',
    'State Bank of India': 'TheOfficialSBI',
    'Hindustan Unilever Ltd.': 'HUL_News',
    'ITC Ltd.': 'ITCCorpCom',
    'Larsen & Toubro Ltd.': 'LarsenToubro',
    
    // Banks
    'Axis Bank Ltd.': 'AxisBank',
    'Kotak Mahindra Bank Ltd.': 'KotakBankLtd',
    'IndusInd Bank Ltd.': 'MyIndusIndBank',
    'IDFC First Bank Ltd.': 'IDFCFIRSTBank',
    'Bank of Baroda': 'bankofbaroda',
    'Punjab National Bank': 'pnbindia',
    'Canara Bank': 'canarabank',
    'Union Bank of India': 'UnionBankTweet',
    
    // Financial Services
    'Bajaj Finance Ltd.': 'BajajFinance',
    'Bajaj Finserv Ltd.': 'BajajFinserv',
    'SBI Life Insurance Company Ltd.': 'SBILife_Official',
    'HDFC Life Insurance Company Ltd.': 'HDFCLife',
    'ICICI Prudential Life Insurance Company Ltd.': 'ICICIPruLife',
    'Bajaj Holdings & Investment Ltd.': 'BajajHolding',
    'Shriram Finance Ltd.': 'ShriramFinance',
    'Cholamandalam Investment and Finance Company Ltd.': 'cholacorporate',
    'SBI Cards and Payment Services Ltd.': 'SBICard_Connect',
    
    // IT & Tech
    'Wipro Ltd.': 'Wipro',
    'HCL Technologies Ltd.': 'HCLTech',
    'Tech Mahindra Ltd.': 'Tech_Mahindra',
    'LTIMindtree Ltd.': 'LTIMindtree',
    'Mphasis Ltd.': 'MphasisCorp',
    'Persistent Systems Ltd.': 'Persistentsys',
    'Coforge Ltd.': 'CoforgeWorld',
    
    // Automobiles
    'Maruti Suzuki India Ltd.': 'Maruti_Corp',
    'Tata Motors Ltd.': 'TataMotors',
    'Mahindra & Mahindra Ltd.': 'MahindraRise',
    'Hero MotoCorp Ltd.': 'HeroMotoCorp',
    'Bajaj Auto Ltd.': 'BajajAuto',
    'Eicher Motors Ltd.': 'eicher_motors',
    'TVS Motor Company Ltd.': 'tvsmotorcompany',
    
    // Pharmaceuticals
    'Sun Pharmaceutical Industries Ltd.': 'Sunpharma_Live',
    'Cipla Ltd.': 'cipla_global',
    'Dr. Reddy\'s Laboratories Ltd.': 'drreddys',
    'Divi\'s Laboratories Ltd.': 'divislab',
    'Apollo Hospitals Enterprise Ltd.': 'ApolloHospitals',
    'Torrent Pharmaceuticals Ltd.': 'TorrentPharma',
    'Alkem Laboratories Ltd.': 'AlkemLabs',
    'Lupin Ltd.': 'LupinGlobal',
    
    // FMCG & Consumer
    'Nestle India Ltd.': 'NestleIndia',
    'Britannia Industries Ltd.': 'BritanniaInd',
    'Tata Consumer Products Ltd.': 'TataCONSUMERS',
    'Dabur India Ltd.': 'DaburIndia',
    'Marico Ltd.': 'MaricoLimited',
    'Godrej Consumer Products Ltd.': 'GCPL_Ltd',
    'Colgate Palmolive (India) Ltd.': 'Colgate_India',
    'United Spirits Ltd.': 'UnitedSpiritsL',
    'Varun Beverages Ltd.': 'VarunBeverages',
    
    // Cement & Construction
    'UltraTech Cement Ltd.': 'UltratechCement',
    'Shree Cement Ltd.': 'shreecemLtd',
    'Grasim Industries Ltd.': 'GrasimIndustry',
    'Ambuja Cements Ltd.': 'AmbujaCement',
    'ACC Ltd.': 'ACCLtd',
    
    // Metals & Mining
    'Tata Steel Ltd.': 'TataSteelLtd',
    'JSW Steel Ltd.': 'jsw_steel',
    'Hindalco Industries Ltd.': 'HindalcoInd',
    'Coal India Ltd.': 'CoalIndiaHQ',
    'NMDC Ltd.': 'NMDC_Ltd',
    'Vedanta Ltd.': 'VedantaLimited',
    'Jindal Steel & Power Ltd.': 'jindalsteel',
    
    // Energy & Power
    'NTPC Ltd.': 'NTPC_Ltd',
    'Power Grid Corporation of India Ltd.': 'POWERGRIDINDIA',
    'Adani Green Energy Ltd.': 'AdaniGreenEner1',
    'Adani Transmission Ltd.': 'AdaniOnline',
    'Tata Power Company Ltd.': 'TataPower',
    'Adani Power Ltd.': 'AdaniOnline',
    'SJVN Ltd.': 'SJVN_Ltd',
    
    // Oil & Gas
    'Bharat Petroleum Corporation Ltd.': 'BPCLimited',
    'Hindustan Petroleum Corporation Ltd.': 'HPCL',
    'Indian Oil Corporation Ltd.': 'IndianOilcl',
    'Oil & Natural Gas Corporation Ltd.': 'ONGC_',
    'GAIL (India) Ltd.': 'GAILGAS',
    
    // Adani Group
    'Adani Enterprises Ltd.': 'AdaniOnline',
    'Adani Ports and Special Economic Zone Ltd.': 'AdaniPortsSEZ',
    'Adani Total Gas Ltd.': 'AdaniGas',
    'Adani Energy Solutions Ltd.': 'AdaniOnline',
    
    // Retail & E-commerce
    'Avenue Supermarts Ltd.': 'DmartReady',
    'Trent Ltd.': 'TRENTLtd',
    'Titan Company Ltd.': 'TitanCompany',
    
    // Telecom
    'Vodafone Idea Ltd.': 'VodafoneIN',
    'Indus Towers Ltd.': 'IndusTowers',
    
    // Others
    'Asian Paints Ltd.': 'AsianPaints',
    'Pidilite Industries Ltd.': 'pidiliteind',
    'Berger Paints India Ltd.': 'BergerPaintsInd',
    'UPL Ltd.': 'UPLLtd',
    'Interglobe Aviation Ltd.': 'IndiGo6E',
    'Siemens Ltd.': 'Siemens_India',
    'ABB India Ltd.': 'ABBIndiaLtd',
    'Bosch Ltd.': 'BoschIndia',
    'Havells India Ltd.': 'HavellsIndia',
    'Voltas Ltd.': 'Voltas_India',
    'Dixon Technologies (India) Ltd.': 'DixonTechno',
    'Bharat Electronics Ltd.': 'bharatelectron',
    'Solar Industries India Ltd.': 'SolarIndustri',
    'Zomato Ltd.': 'zomato',
    'One 97 Communications Ltd.': 'Paytm',
    'PB Fintech Ltd.': 'Policybazaar',
  };

  const handle = handles[companyName];

  // Check if this company uses API (top 10 companies)
  const isAPIEnabled = API_ENABLED_COMPANIES.includes(companyName);

  useEffect(() => {
    // Reset tracking when company changes
    setShownTweetIds(new Set());
    setShownAuthorIds(new Set());
    setNextToken(null);
    setHasMore(false);
    setTweets([]);
    
    if (isAPIEnabled) {
      // Fetch tweets from API for top 10 companies
      fetchTweetsFromAPI();
      // Also fetch stored tweets from database
      fetchStoredTweets();
    } else {
      // Load Twitter widget script for other companies
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [companyName, isAPIEnabled, fetchTrigger]);

  const fetchTweetsFromAPI = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setUseAPI(true);
    setShowingStored(false);

    try {
      console.log(`🐦 Fetching ${isLoadMore ? 'more' : 'live'} tweets for ${companyName}...`);
      
      // Build query params
      let url = `${API_ENDPOINTS.TWITTER_TWEETS(companyName)}?limit=10`;
      
      // Add date filter if enabled
      if (dateFilter?.enabled && dateFilter.startDate) {
        url += `&startDate=${dateFilter.startDate}`;
      }
      if (dateFilter?.enabled && dateFilter.endDate) {
        url += `&endDate=${dateFilter.endDate}`;
      }
      
      // Add pagination token for load more
      if (isLoadMore && nextToken) {
        url += `&next_token=${nextToken}`;
      }
      
      // Add exclusion lists ONLY for load more (to ensure uniqueness)
      if (isLoadMore) {
        if (shownTweetIds.size > 0) {
          url += `&excludeTweetIds=${Array.from(shownTweetIds).join(',')}`;
        }
        if (shownAuthorIds.size > 0) {
          url += `&excludeAuthorIds=${Array.from(shownAuthorIds).join(',')}`;
        }
        console.log(`🚫 Excluding ${shownAuthorIds.size} authors and ${shownTweetIds.size} tweets`);
      } else {
        console.log(`🆕 Fresh fetch - no exclusions`);
      }
      
      const response = await axios.get(url);

      if (response.data.success) {
        const newTweets = response.data.tweets;
        
        // Client-side deduplication as safety measure
        const filteredTweets = isLoadMore 
          ? newTweets.filter(tweet => {
              // Double-check: exclude tweets we've already shown
              if (shownTweetIds.has(tweet.id)) {
                console.warn(`⚠️ Client-side caught duplicate tweet: ${tweet.id}`);
                return false;
              }
              if (shownAuthorIds.has(tweet.author.id)) {
                console.warn(`⚠️ Client-side caught duplicate author: ${tweet.author.id}`);
                return false;
              }
              return true;
            })
          : newTweets; // No filtering needed for initial fetch
        
        if (isLoadMore && filteredTweets.length < newTweets.length) {
          console.log(`🔍 Client-side filtered out ${newTweets.length - filteredTweets.length} duplicate(s)`);
        }
        
        // Update shown IDs tracking differently for initial vs load more
        if (isLoadMore) {
          // Load More: Add to existing tracking
          const newTweetIds = new Set(shownTweetIds);
          const newAuthorIds = new Set(shownAuthorIds);
          
          filteredTweets.forEach(tweet => {
            newTweetIds.add(tweet.id);
            newAuthorIds.add(tweet.author.id);
          });
          
          setShownTweetIds(newTweetIds);
          setShownAuthorIds(newAuthorIds);
          setNextToken(response.data.nextToken);
          setHasMore(response.data.hasMore || false);
          
          // Append to existing tweets (only filtered ones)
          setTweets(prev => [...prev, ...filteredTweets]);
          const totalAfter = tweets.length + filteredTweets.length;
          console.log(`✅ Loaded ${filteredTweets.length} NEW unique tweets (${tweets.length} → ${totalAfter})`);
          console.log(`📊 Now tracking ${newAuthorIds.size} unique authors, ${newTweetIds.size} unique tweets`);
          console.log(`🎯 All ${filteredTweets.length} tweets are from DIFFERENT authors`);
        } else {
          // Initial Fetch: Reset tracking with new tweets
          const freshTweetIds = new Set();
          const freshAuthorIds = new Set();
          
          filteredTweets.forEach(tweet => {
            freshTweetIds.add(tweet.id);
            freshAuthorIds.add(tweet.author.id);
          });
          
          setShownTweetIds(freshTweetIds);
          setShownAuthorIds(freshAuthorIds);
          setNextToken(response.data.nextToken);
          setHasMore(response.data.hasMore || false);
          
          // Replace tweets
          setTweets(filteredTweets);
          console.log(`✅ Loaded ${filteredTweets.length} live tweets (fresh start)`);
          console.log(`📊 Tracking ${freshAuthorIds.size} unique authors, ${freshTweetIds.size} unique tweets`);
        }
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      console.error('❌ Failed to fetch tweets:', err);
      setError(err.response?.data?.error || 'Failed to load tweets from Twitter API');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStoredTweets = async () => {
    setLoadingStored(true);
    
    try {
      console.log(`📂 Fetching stored tweets for ${companyName}...`);
      
      // Build query params
      let url = `${API_ENDPOINTS.TWITTER_STORED(companyName)}?limit=50`;
      
      // Add date filter if enabled
      if (dateFilter?.enabled && dateFilter.startDate) {
        url += `&startDate=${dateFilter.startDate}`;
      }
      if (dateFilter?.enabled && dateFilter.endDate) {
        url += `&endDate=${dateFilter.endDate}`;
      }
      
      const response = await axios.get(url);

      if (response.data.success && response.data.tweets.length > 0) {
        setStoredTweets(response.data.tweets);
        console.log(`✅ Loaded ${response.data.tweets.length} stored tweets`);
      } else {
        console.log('ℹ️ No stored tweets found');
        setStoredTweets([]);
      }
    } catch (err) {
      console.error('⚠️ Failed to fetch stored tweets:', err);
      setStoredTweets([]);
    } finally {
      setLoadingStored(false);
    }
  };

  const toggleTweetView = () => {
    setShowingStored(!showingStored);
  };

  // Handle case when company doesn't have Twitter handle mapped
  if (!handle) {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {companyName}
          </h1>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to News
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Twitter Handle Not Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We don't have the Twitter handle for <strong>{companyName}</strong> yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              This company may not have an official Twitter presence or we haven't mapped it yet.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Return to News Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1.5">
          {companyName}
        </h1>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="font-medium">Tweets about @{handle}</span>
          </span>
          {isAPIEnabled && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
                Live API
            </span>
          )}
          {showingStored && (
            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 rounded-full text-xs font-semibold">
              📂 From Database
            </span>
          )}
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full text-xs font-semibold">
            💬 Public Discussion
          </span>
          <a
            href={`https://twitter.com/search?q=%40${handle}%20OR%20%22${encodeURIComponent(companyName)}%22`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
          >
            🔗 Search on X
          </a>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to News
          </button>
          
          {/* Toggle between Live and Stored Tweets */}
          {isAPIEnabled && storedTweets.length > 0 && (
            <button
              onClick={toggleTweetView}
              disabled={loading || loadingStored}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showingStored ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Show Live Tweets
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Show Stored ({storedTweets.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
        {isAPIEnabled ? (
          // API Tweets for top 10 companies
          <div className="px-6 pt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading tweets from Twitter API...</p>
              </div>
            ) : error ? (
              <div className="max-w-2xl mx-auto mt-8">
                <div className={`rounded-lg p-6 border ${
                  error.includes('Rate limit') || error.includes('15 requests')
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      error.includes('Rate limit') || error.includes('15 requests')
                        ? 'bg-yellow-100 dark:bg-yellow-900/50'
                        : 'bg-red-100 dark:bg-red-900/50'
                    }`}>
                      {error.includes('Rate limit') || error.includes('15 requests') ? (
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-2 ${
                        error.includes('Rate limit') || error.includes('15 requests')
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {error.includes('Rate limit') || error.includes('15 requests') ? 'Rate Limit Reached' : 'Failed to Load Tweets'}
                      </h3>
                      <p className={`mb-4 text-sm ${
                        error.includes('Rate limit') || error.includes('15 requests')
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {error}
                      </p>
                      
                      {(error.includes('Rate limit') || error.includes('15 requests')) && (
                        <>
                          <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-3 mb-4 text-sm text-yellow-800 dark:text-yellow-200">
                            <p className="font-medium mb-1">💡 Why this happened:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Twitter Free API allows only <strong>15 requests per 15 minutes</strong></li>
                              <li>You've exceeded this limit by refreshing too quickly</li>
                              <li>Tweets are now cached for 5 minutes to reduce API calls</li>
                              <li>Wait 5-15 minutes before trying again</li>
                            </ul>
                          </div>
                          
                          {/* Show stored tweets option if available */}
                          {storedTweets.length > 0 && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1">
                                    ✨ Good News! We have {storedTweets.length} stored tweets available
                                  </p>
                                  <p className="text-xs text-purple-700 dark:text-purple-400">
                                    View previously fetched tweets from our database while waiting for API access
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        {/* View Stored Tweets Button - Show when rate limited and stored tweets exist */}
                        {(error.includes('Rate limit') || error.includes('15 requests')) && storedTweets.length > 0 && (
                          <button
                            onClick={() => {
                              setShowingStored(true);
                              setError(null);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium shadow-md flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                            </svg>
                            Show Stored ({storedTweets.length})
                          </button>
                        )}
                        
                        <button
                          onClick={fetchTweetsFromAPI}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            error.includes('Rate limit') || error.includes('15 requests')
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-yellow-400'
                              : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400'
                          } disabled:cursor-not-allowed`}
                        >
                          {loading ? 'Retrying...' : (error.includes('Rate limit') || error.includes('15 requests')) ? 'Try Again (Wait 5+ mins)' : 'Try Again'}
                        </button>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                        >
                          Back to News
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (showingStored ? storedTweets : tweets).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  No {showingStored ? 'Stored' : ''} Tweets Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {showingStored ? 'No tweets stored in database yet' : 'No recent tweets found'}
                </p>
                {dateFilter?.enabled && (dateFilter.startDate || dateFilter.endDate) && (
                  <div className="mt-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg max-w-md">
                    <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Date filter active: {dateFilter.startDate || 'any'} to {dateFilter.endDate || 'any'}
                      </span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
                      Try adjusting the date range or disable the filter
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* View Indicator Badge */}
                {showingStored && (
                  <div className="mb-4 flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      <span className="font-semibold text-purple-800 dark:text-purple-300">
                        📂 Viewing Stored Tweets ({storedTweets.length})
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Sentiment Overview Dashboard */}
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-gray-600 p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Sentiment Overview {showingStored && '(Stored)'}
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {/* Total Tweets */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {(showingStored ? storedTweets : tweets).length}
                      </div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Tweets</div>
                    </div>

                    {/* Positive */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {(showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'positive').length}
                        </span>
                        <span className="text-2xl">😊</span>
                      </div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Positive ({Math.round(((showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'positive').length / (showingStored ? storedTweets : tweets).length) * 100)}%)
                      </div>
                    </div>

                    {/* Negative */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {(showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'negative').length}
                        </span>
                        <span className="text-2xl">😟</span>
                      </div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Negative ({Math.round(((showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'negative').length / (showingStored ? storedTweets : tweets).length) * 100)}%)
                      </div>
                    </div>

                    {/* Neutral */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-300 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                          {(showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'neutral').length}
                        </span>
                        <span className="text-2xl">😐</span>
                      </div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Neutral ({Math.round(((showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'neutral').length / (showingStored ? storedTweets : tweets).length) * 100)}%)
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Progress Bar */}
                  <div className="mt-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-700 ease-out"
                        style={{ width: `${((showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'positive').length / (showingStored ? storedTweets : tweets).length) * 100}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-500 h-full transition-all duration-700 ease-out"
                        style={{ width: `${((showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'negative').length / (showingStored ? storedTweets : tweets).length) * 100}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-gray-400 to-gray-500 h-full transition-all duration-700 ease-out"
                        style={{ width: `${((showingStored ? storedTweets : tweets).filter(t => t.sentiment === 'neutral').length / (showingStored ? storedTweets : tweets).length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tweets List */}
                <div className="space-y-4 pb-6">{(showingStored ? storedTweets : tweets).map((tweet) => (
                  <div
                    key={tweet.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Tweet Header with Author and Sentiment Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Author Profile Image or Initials - Clickable */}
                        <a 
                          href={`https://twitter.com/${tweet.author?.username || 'twitter'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                        >
                          {tweet.author?.profileImage ? (
                            <img 
                              src={tweet.author.profileImage} 
                              alt={tweet.author.name}
                              className="w-12 h-12 rounded-full shadow-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {tweet.author?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </a>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {/* Clickable Author Name */}
                            <a 
                              href={`https://twitter.com/${tweet.author?.username || 'twitter'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-gray-800 dark:text-white text-base hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {tweet.author?.name || 'Unknown User'}
                            </a>
                            {tweet.author?.verified && (
                              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                              </svg>
                            )}
                            {tweet.isRetweet && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                                🔄 Retweet
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            {/* Clickable Username */}
                            <a 
                              href={`https://twitter.com/${tweet.author?.username || 'twitter'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              @{tweet.author?.username || 'unknown'}
                            </a>
                            <span>•</span>
                            <span>{new Date(tweet.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                            <span>•</span>
                            <span>{new Date(tweet.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sentiment Badge */}
                      {tweet.sentiment && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold shadow-md ${
                          tweet.sentiment === 'positive'
                            ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                            : tweet.sentiment === 'negative'
                            ? 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                            : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                        }`}>
                          <span className="text-xl">{tweet.sentimentEmoji || '😐'}</span>
                          <span className="capitalize">{tweet.sentiment}</span>
                          {tweet.sentimentConfidence && (
                            <span className="text-xs opacity-75 font-normal">({tweet.sentimentConfidence}%)</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tweet Content */}
                    <p className="text-gray-800 dark:text-white text-base leading-relaxed mb-4 whitespace-pre-wrap">
                      {tweet.text}
                    </p>

                    {/* Tweet Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-medium">{tweet.replies.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="font-medium">{tweet.retweets.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-medium">{tweet.likes.toLocaleString()}</span>
                      </div>
                      {tweet.views > 0 && (
                        <div className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="font-medium">{tweet.views.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* View on X Link */}
                    <a
                      href={tweet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors text-sm"
                    >
                      <span>View on X</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                ))}
                </div>
                
                {/* Load More Tweets Button */}
                {!showingStored && hasMore && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    {/* Info badge above button */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Each click loads 10 NEW unique tweets from different authors
                      </span>
                    </div>
                    
                    <button
                      onClick={() => fetchTweetsFromAPI(true)}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading 10 new tweets...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Load 10 More Tweets (Unique Authors)
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* End of tweets message */}
                {!showingStored && !hasMore && tweets.length > 0 && (
                  <div className="flex justify-center py-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg px-6 py-4 text-center shadow-md">
                      <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold text-lg">All Unique Tweets Loaded!</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          📊 {tweets.length} total tweets • 👥 {shownAuthorIds.size} different authors
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          ✨ Every tweet from a unique person - no duplicates!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Info message when showing stored tweets */}
                {showingStored && (
                  <div className="flex justify-center py-6">
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg px-6 py-3 text-sm text-purple-800 dark:text-purple-300">
                      <span className="font-medium">📂 Showing all stored tweets from database</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Embedded Widget for Other Companies
          <div className="h-full px-6 pt-4">
            <a 
              className="twitter-timeline"
              data-height="100%"
              data-theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              data-chrome="noheader nofooter noborders"
              href={`https://twitter.com/${handle}?ref_src=twsrc%5Etfw`}
            >
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading tweets from @{handle}...</p>
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
