import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import SettingsModal from '../components/SettingsModal';
import { COMPANIES } from '../components/Sidebar';

export default function HomePage({ onGetStarted, onOpenHelp, onOpenFeedback, onOpenLLM, onSettingsChange }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, signup, login, googleLogin, logout, isAuthenticated } = useAuth();
  const analysisApiUrl = import.meta.env.VITE_ANALYSIS_API_URL || 'http://localhost:5001';
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompanyGrid, setShowCompanyGrid] = useState(false);
  const [analysisSearch, setAnalysisSearch] = useState('');
  const [analysisCompany, setAnalysisCompany] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisRange, setAnalysisRange] = useState('1d');
  const [hoverPoint, setHoverPoint] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const rangeOptions = [
    { key: '1d', label: '1D' },
    { key: '5d', label: '5D' },
    { key: '1m', label: '1M' },
    { key: '6m', label: '6M' },
    { key: 'ytd', label: 'YTD' },
    { key: '1y', label: '1Y' },
    { key: '5y', label: '5Y' },
    { key: 'max', label: 'Max' }
  ];
  
  // Auth form state
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '—';
    return Intl.NumberFormat('en-IN').format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(2)}%`;
  };


  const formatAxisLabel = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    if (['1d', '5d'].includes(analysisRange)) {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (['1m', '6m', 'ytd', '1y'].includes(analysisRange)) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
      });
    }

    return date.toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit'
    });
  };

  const getAxisLabels = (history) => {
    if (!history || history.length === 0) return [];
    const total = history.length;
    const slots = total < 4 ? total : 4;
    const step = Math.max(Math.floor((total - 1) / (slots - 1 || 1)), 1);

    return Array.from({ length: slots }, (_, i) => {
      const index = i === slots - 1 ? total - 1 : i * step;
      const point = history[index];
      return {
        index,
        label: formatAxisLabel(point?.time)
      };
    });
  };

  const getIstNow = () => {
    return new Date(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  };

  const isMarketOpen = () => {
    const now = getIstNow();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;

    const open = new Date(now);
    open.setHours(9, 15, 0, 0);
    const close = new Date(now);
    close.setHours(15, 30, 0, 0);

    return now >= open && now <= close;
  };

  const fetchAnalysis = async (company, range, options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setAnalysisLoading(true);
      setAnalysisError('');
    }

    try {
      const response = await axios.get(`${analysisApiUrl}/analysis/company`, {
        params: {
          name: company.name,
          symbol: company.symbol,
          range
        }
      });
      setAnalysisData(response.data);
      setAnalysisRange(range);
      setLastUpdated(new Date());
      if (!silent) {
        setAnalysisError('');
      }
    } catch (error) {
      if (!silent) {
        setAnalysisError(error.response?.data?.detail || 'Failed to load analysis data.');
      }
    } finally {
      if (!silent) {
        setAnalysisLoading(false);
      }
    }
  };

  const openAnalysis = async (company) => {
    setShowCompanyGrid(false);
    setAnalysisCompany(company);
    setAnalysisData(null);
    await fetchAnalysis(company, '1d');
  };

  const handleRangeChange = (range) => {
    if (!analysisCompany || analysisLoading || range === analysisRange) return;
    fetchAnalysis(analysisCompany, range);
  };

  useEffect(() => {
    if (!analysisCompany || analysisRange !== '1d') return undefined;
    const poll = () => {
      if (isMarketOpen()) {
        fetchAnalysis(analysisCompany, '1d', { silent: true });
      }
    };
    const intervalId = setInterval(poll, 60000);
    return () => clearInterval(intervalId);
  }, [analysisCompany, analysisRange]);

  useEffect(() => {
    const shouldLockScroll = showCompanyGrid || Boolean(analysisCompany);
    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCompanyGrid, analysisCompany]);

  const formatChartTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const marketStatus = isMarketOpen() ? 'Market Open' : 'Market Closed';
  const formatUpdateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Handle News button click with authentication check
  const handleNewsClick = () => {
    if (isAuthenticated) {
      // User is logged in, navigate to news UI
      onGetStarted();
    } else {
      // User is not logged in, show login modal
      setIsSignup(false);
      setShowLoginModal(true);
      setAuthError('Please login or sign up to access the news dashboard.');
    }
  };

  // Handle LLM button click with authentication check
  const handleLLMClick = () => {
    if (isAuthenticated) {
      // User is logged in, navigate to LLM chat
      onOpenLLM();
    } else {
      // User is not logged in, show login modal
      setIsSignup(false);
      setShowLoginModal(true);
      setAuthError('Please login or sign up to access the LLM chat.');
    }
  };

  // Handle auth form input changes
  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthForm(prev => ({
      ...prev,
      [name]: value
    }));
    setAuthError('');
  };

  // Handle traditional login/signup
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      let result;
      if (isSignup) {
        result = await signup(
          authForm.fullName,
          authForm.email,
          authForm.password,
          authForm.confirmPassword
        );
      } else {
        result = await login(authForm.email, authForm.password);
      }

      if (result.success) {
        setAuthSuccess(result.message);
        
        // If signup was successful, switch to login mode after showing message
        if (result.requireLogin) {
          setTimeout(() => {
            setAuthSuccess('');
            setIsSignup(false);
            setAuthForm({
              fullName: '',
              email: authForm.email, // Keep email for convenience
              password: '',
              confirmPassword: ''
            });
          }, 2000);
        } else {
          // For login, close modal
          setTimeout(() => {
            setShowLoginModal(false);
          }, 1500);
        }
      } else {
        setAuthError(result.message);
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const filteredAnalysisCompanies = COMPANIES.filter(company =>
    company.name.toLowerCase().includes(analysisSearch.trim().toLowerCase())
  );

  // Handle Google OAuth success
  const handleGoogleSuccess = async (credentialResponse) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const result = await googleLogin(credentialResponse.credential, {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
      });

      if (result.success) {
        setAuthSuccess(result.message);
        setTimeout(() => {
          setShowLoginModal(false);
        }, 1500);
      } else {
        setAuthError(result.message);
      }
    } catch (error) {
      setAuthError('Google login failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Google OAuth failure
  const handleGoogleError = () => {
    setAuthError('Google login failed. Please try again.');
  };

  const handleLaunchDashboard = () => {
    if (!isAuthenticated) {
      setIsSignup(false);
      setAuthError('Please log in to access the dashboard.');
      setShowLoginModal(true);
      return;
    }
    onGetStarted();
  };

  const handleOpenAnalysis = () => {
    if (!isAuthenticated) {
      setIsSignup(false);
      setAuthError('Please log in to access the analysis page.');
      setShowLoginModal(true);
      return;
    }
    setShowCompanyGrid(true);
  };

  // Handle contact form input changes
  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      const response = await axios.post(API_ENDPOINTS.CONTACTS, contactForm);

      if (response.data.success) {
        setSubmitMessage({
          type: 'success',
          text: response.data.message
        });
        // Reset form
        setContactForm({
          fullName: '',
          email: '',
          phoneNumber: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animated companies ticker
  const companies = [
    { name: 'Reliance', change: '+2.4%', positive: true },
    { name: 'TCS', change: '+1.8%', positive: true },
    { name: 'Infosys', change: '-0.5%', positive: false },
    { name: 'HDFC Bank', change: '+3.2%', positive: true },
    { name: 'Tata Motors', change: '+4.1%', positive: true },
    { name: 'Wipro', change: '-1.2%', positive: false },
    { name: 'Adani', change: '+2.7%', positive: true },
    { name: 'ITC', change: '+1.5%', positive: true },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0B0F1A] dark:text-slate-100 transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-11 h-11 bg-[#0EA5E9] rounded-2xl flex items-center justify-center shadow-[0_12px_30px_rgba(14,165,233,0.35)] transition-transform group-hover:-translate-y-0.5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  NEWSINSIGHT
                </span>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 tracking-[0.2em]">AI MARKET INTEL</div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scrollToSection('home')}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-sm font-semibold transition-all"
              >
                Home
              </button>
              <button
                onClick={handleNewsClick}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-sm font-semibold transition-all"
              >
                News
              </button>
              <button
                onClick={handleOpenAnalysis}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-sm font-semibold transition-all"
              >
                Analysis
              </button>
              <button
                onClick={handleLLMClick}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-sm font-semibold transition-all"
              >
                LLM
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-sm font-semibold transition-all"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-sm font-semibold transition-all"
              >
                About
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                    aria-label="Toggle theme"
                  >
                    {isDark ? (
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsSignup(false);
                      setShowLoginModal(true);
                    }}
                    className="px-5 py-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsSignup(true);
                      setShowLoginModal(true);
                    }}
                    className="px-6 py-2.5 bg-[#0EA5E9] text-white rounded-full font-semibold hover:bg-[#0284C7] shadow-[0_10px_30px_rgba(14,165,233,0.35)] transition-all"
                  >
                    Sign Up Free
                  </button>
                </>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTheme}
                      className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                      aria-label="Toggle theme"
                    >
                      {isDark ? (
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-slate-800 dark:text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAccountMenu(!showAccountMenu)}
                      className="w-10 h-10 rounded-full bg-[#1E40AF] hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-white font-semibold text-sm"
                      aria-label="Account menu"
                    >
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full" />
                      ) : (
                        <span>{user?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </button>
                  </div>

                  {/* Account Dropdown Menu */}
                  {showAccountMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowAccountMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                        {/* Profile Section */}
                        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
                          <div className="w-20 h-20 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3 shadow-md">
                            {user?.profilePicture ? (
                              <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full" />
                            ) : (
                              <span>{user?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{user?.fullName || 'User'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{user?.email || ''}</p>
                          <button className="px-5 py-2 border border-[#1E40AF] text-[#1E40AF] rounded-full hover:bg-[#EFF6FF] transition-colors text-sm font-medium">
                            Manage your Account
                          </button>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <button className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Profile</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              setShowSettings(true);
                            }}
                            className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              onOpenHelp && onOpenHelp();
                            }}
                            className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Help & Support</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              onOpenFeedback && onOpenFeedback();
                            }}
                            className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span>Send Feedback</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              // Privacy & Terms can open a modal or scroll to footer
                              alert('Privacy & Terms - View our privacy policy and terms of service');
                            }}
                            className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Privacy & Terms</span>
                          </button>
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-gray-200 dark:border-gray-700 py-3 px-5">
                          <button
                            onClick={() => {
                              logout();
                              setShowAccountMenu(false);
                            }}
                            className="w-full px-5 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showCompanyGrid && !analysisCompany && (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-gray-900 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Company Analysis</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">All tracked NIFTY 100 companies</p>
              </div>
              <button
                onClick={() => setShowCompanyGrid(false)}
                className="px-4 py-2 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
            </div>
            <div className="mb-4">
              <div className="relative max-w-md">
                <input
                  type="text"
                  value={analysisSearch}
                  onChange={(e) => setAnalysisSearch(e.target.value)}
                  placeholder="Search companies..."
                  className="w-full rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAnalysisCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => openAnalysis(company)}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <img
                      src={company.logo}
                      alt=""
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'block';
                      }}
                    />
                    <span className="text-xl hidden" aria-hidden="true">
                      {company.icon}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {company.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {analysisCompany && (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-gray-900 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 pt-24 pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company Analysis</p>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {analysisData?.name || analysisCompany.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {analysisData?.symbol ? `${analysisData.symbol} • ` : ''}{analysisData?.currency || ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAnalysisCompany(null);
                    setAnalysisData(null);
                    setShowCompanyGrid(true);
                  }}
                  className="px-4 py-2 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Back to Analysis Grid
                </button>
              </div>
            </div>

            {analysisLoading && (
              <div className="text-center py-20 text-gray-600 dark:text-gray-300">Loading analysis...</div>
            )}

            {analysisError && !analysisLoading && (
              <div className="text-center py-16 text-red-500">{analysisError}</div>
            )}

            {!analysisLoading && !analysisError && analysisData && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Live Price</p>
                        <div className="flex items-end gap-3">
                          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {analysisData.price ? `${analysisData.price.toFixed(2)}` : '—'}
                          </h3>
                          <span className={`text-sm font-semibold ${analysisData.change && analysisData.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {analysisData.change ? `${analysisData.change.toFixed(2)} (${formatPercent((analysisData.changePercent || 0) * 100)})` : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${marketStatus === 'Market Open' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300'}`}>
                            {marketStatus}
                          </span>
                          {lastUpdated && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Updated {formatUpdateTime(lastUpdated)} IST
                            </span>
                          )}
                        </div>
                        {rangeOptions.map((rangeOption) => (
                          <button
                            key={rangeOption.key}
                            onClick={() => handleRangeChange(rangeOption.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${analysisRange === rangeOption.key ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                          >
                            {rangeOption.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-64 w-full relative">
                      {analysisData.history?.length ? (
                        <svg
                          viewBox="0 0 600 240"
                          className="w-full h-full"
                          onMouseLeave={() => setHoverPoint(null)}
                        >
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={analysisData.change && analysisData.change >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0.3" />
                              <stop offset="100%" stopColor={analysisData.change && analysisData.change >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const prices = analysisData.history.map((item) => item.close).filter((value) => value !== null);
                            if (!prices.length) {
                              return null;
                            }
                            const min = Math.min(...prices);
                            const max = Math.max(...prices);
                            const points = analysisData.history.map((point, index) => {
                              const value = point.close ?? min;
                              const x = (index / Math.max(analysisData.history.length - 1, 1)) * 600;
                              const y = 220 - ((value - min) / (max - min || 1)) * 180;
                              return {
                                x,
                                y,
                                close: value,
                                time: point.time,
                                xPercent: (x / 600) * 100
                              };
                            });
                            const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
                            const areaPoints = `${linePoints} 600,220 0,220`;

                            const handleMove = (event) => {
                              const bounds = event.currentTarget.getBoundingClientRect();
                              const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
                              const chartX = (relativeX / bounds.width) * 600;
                              const index = Math.round((chartX / 600) * (points.length - 1));
                              const clampedIndex = Math.min(Math.max(index, 0), points.length - 1);
                              setHoverPoint(points[clampedIndex]);
                            };

                            return (
                              <>
                                {[40, 80, 120, 160, 200].map((y) => (
                                  <line
                                    key={y}
                                    x1="0"
                                    x2="600"
                                    y1={y}
                                    y2={y}
                                    stroke="#334155"
                                    strokeDasharray="2 6"
                                    strokeWidth="1"
                                  />
                                ))}
                                <rect
                                  x="0"
                                  y="0"
                                  width="600"
                                  height="240"
                                  fill="transparent"
                                  onMouseMove={handleMove}
                                />
                                <polygon fill="url(#priceGradient)" points={areaPoints} />
                                <polyline
                                  fill="none"
                                  stroke={analysisData.change && analysisData.change >= 0 ? '#10B981' : '#EF4444'}
                                  strokeWidth="2.5"
                                  points={linePoints}
                                />
                                {hoverPoint && (
                                  <>
                                    <line
                                      x1={hoverPoint.x}
                                      x2={hoverPoint.x}
                                      y1="20"
                                      y2="220"
                                      stroke="#94A3B8"
                                      strokeDasharray="4 4"
                                      strokeWidth="1"
                                    />
                                    <circle
                                      cx={hoverPoint.x}
                                      cy={hoverPoint.y}
                                      r="4"
                                      fill="#FFFFFF"
                                      stroke={analysisData.change && analysisData.change >= 0 ? '#10B981' : '#EF4444'}
                                      strokeWidth="2"
                                    />
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </svg>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">Chart data unavailable</div>
                      )}
                      {analysisData.history?.length ? (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between text-[11px] text-gray-500 dark:text-gray-400 py-3">
                          {(() => {
                            const prices = analysisData.history.map((item) => item.close).filter((value) => value !== null);
                            if (!prices.length) return null;
                            const min = Math.min(...prices);
                            const max = Math.max(...prices);
                            const steps = 4;
                            return Array.from({ length: steps + 1 }, (_, index) => {
                              const value = max - (index * (max - min)) / steps;
                              return (
                                <div key={`price-${index}`} className="flex items-center gap-2">
                                  <span className="w-10 text-right">{value.toFixed(2)}</span>
                                  <span className="h-px w-2 bg-gray-600/40" />
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : null}
                      {hoverPoint && (
                        <div
                          className="absolute top-3 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg"
                          style={{ left: `${hoverPoint.xPercent}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="font-semibold">{hoverPoint.close?.toFixed(2) || '—'}</div>
                          <div className="text-gray-300">{formatChartTime(hoverPoint.time)}</div>
                        </div>
                      )}
                    </div>
                    {analysisData.history?.length ? (
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        {getAxisLabels(analysisData.history).map((label, index) => (
                          <span key={`${label.label}-${index}`}>{label.label}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 p-5">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">OHLC</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Open</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{analysisData.ohlc.open?.toFixed(2) || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">High</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{analysisData.ohlc.high?.toFixed(2) || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Low</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{analysisData.ohlc.low?.toFixed(2) || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Close</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{analysisData.ohlc.close?.toFixed(2) || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 p-5">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Volume</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Current</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(analysisData.volume)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Average</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(analysisData.avgVolume)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 p-5">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">Key Stats</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Market Cap</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(analysisData.fundamentals.marketCap)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">P/E Ratio</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{analysisData.fundamentals.peRatio?.toFixed(2) || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">EPS (TTM)</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{analysisData.fundamentals.eps?.toFixed(2) || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Dividend Yield</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{analysisData.fundamentals.dividendYield ? formatPercent(analysisData.fundamentals.dividendYield * 100) : '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">52W High</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{analysisData.fundamentals.fiftyTwoWeekHigh?.toFixed(2) || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">52W Low</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{analysisData.fundamentals.fiftyTwoWeekLow?.toFixed(2) || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Volume</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(analysisData.volume)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Avg Volume</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(analysisData.avgVolume)}</span>
                      </div>
                    </div>
                  </div>
                  {analysisData.indicators && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 p-5">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">Indicators</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">RSI (14)</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.rsi?.toFixed(2) || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">MACD</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.macd?.macd?.toFixed(2) || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">MACD Signal</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.macd?.signal?.toFixed(2) || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">MACD Histogram</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.macd?.histogram?.toFixed(2) || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">SMA 20</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.sma20?.toFixed(2) || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">SMA 50</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.sma50?.toFixed(2) || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">EMA 20</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.ema20?.toFixed(2) || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">EMA 50</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{analysisData.indicators.ema50?.toFixed(2) || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section (Home) */}
      <section id="home" className="pt-32 pb-24 px-6 relative overflow-hidden min-h-screen flex items-center bg-slate-50 dark:bg-[#0B0F1A]">
        {/* Atmospheric Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(226,232,240,0.9))] dark:bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.6),_rgba(11,15,26,0.95))]"></div>
        </div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="absolute -top-20 right-0 w-[32rem] h-[32rem] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-28 left-12 w-[28rem] h-[28rem] bg-blue-600/10 rounded-full blur-[120px]"></div>

        <div className="max-w-7xl mx-auto relative z-20 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-cyan-200">
              <span className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-pulse"></span>
              Built for market speed and signal clarity
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-900 dark:text-white">
              Trade on insight.
              <span className="block mt-3 bg-gradient-to-r from-cyan-300 to-blue-500 text-transparent bg-clip-text">
                Read the market faster.
              </span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              NewsInsight blends market-moving headlines, AI sentiment, and live analytics so you can act with confidence across every session.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleLaunchDashboard}
                className="group px-8 py-4 bg-[#0EA5E9] text-white rounded-full font-semibold text-lg hover:bg-[#0284C7] shadow-[0_15px_40px_rgba(14,165,233,0.35)] transition-all duration-300 flex items-center gap-2"
              >
                Launch Dashboard
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="px-8 py-4 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white rounded-full font-semibold text-lg hover:border-cyan-300 hover:text-cyan-500 dark:hover:text-cyan-200 transition-all duration-300"
              >
                Explore Capabilities
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-6">
              {[
                { label: 'Markets tracked', value: '100+ equities' },
                { label: 'Signals per day', value: '2,500+' },
                { label: 'Analyst grade AI', value: 'FinBERT + Gemini' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mt-2">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Enhanced Dashboard Preview */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A]/80 shadow-[0_30px_80px_rgba(15,23,42,0.2)] dark:shadow-[0_30px_80px_rgba(15,23,42,0.8)] backdrop-blur-xl">
              <div className="p-8">
                {/* Browser Bar */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-xs text-slate-600 dark:text-slate-300">newsinsight.ai</div>
                </div>
                
                {/* Dashboard Content */}
                <div className="space-y-5">
                  {/* Market Overview Card */}
                  <div className="relative p-5 bg-gradient-to-br from-[#0EA5E9]/10 to-[#22D3EE]/5 rounded-2xl border border-cyan-500/20 overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl"></div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">NIFTY 50</div>
                        <div className="text-4xl font-bold text-slate-900 dark:text-white">₹22,368</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-emerald-400 font-bold text-lg">+347.50</span>
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-sm font-semibold">+1.58%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Live Updates</div>
                        <div className="flex items-center gap-1 text-emerald-400 mt-1">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                          <span className="text-xs font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini Chart */}
                  <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">24H PERFORMANCE</span>
                      <span className="text-xs text-emerald-400 font-semibold">↗ Trending Up</span>
                    </div>
                    <div className="h-24">
                      <svg className="w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.35)" />
                            <stop offset="100%" stopColor="rgba(14, 165, 233, 0)" />
                          </linearGradient>
                        </defs>
                        <path d="M0,60 L40,55 L80,50 L120,45 L160,35 L200,30 L240,25 L280,22 L320,18 L360,15 L400,10" 
                          fill="url(#chartGradient)" />
                        <path d="M0,60 L40,55 L80,50 L120,45 L160,35 L200,30 L240,25 L280,22 L320,18 L360,15 L400,10" 
                          stroke="rgb(14, 165, 233)" strokeWidth="2.5" fill="none" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Sentiment Cards Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Positive</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">68%</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">↑ 12%</div>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Negative</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-300">22%</div>
                      <div className="text-xs text-red-600 dark:text-red-300 mt-1">↓ 8%</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Neutral</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">10%</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">→ 0%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Floating Elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>

      {/* Animated Ticker */}
      <div className="relative bg-slate-100 dark:bg-[#0F172A] border-y border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="flex animate-scroll">
          {[...companies, ...companies].map((company, index) => (
            <div key={index} className="flex items-center gap-3 px-8 py-4 whitespace-nowrap">
              <span className="text-slate-700 dark:text-slate-200 font-medium">{company.name}</span>
              <span className={`font-bold ${company.positive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {company.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>

      {/* News Section */}
      <section id="news" className="py-20 px-6 bg-slate-50 dark:bg-[#0F172A] border-t border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Market Pulse</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">Real-time headlines ranked by sentiment and momentum.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { company: 'Reliance Industries', sentiment: 'positive', count: 245, change: '+12%' },
              { company: 'Tata Motors', sentiment: 'neutral', count: 189, change: '+5%' },
              { company: 'Infosys', sentiment: 'positive', count: 312, change: '+18%' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-[#0B0F1A] rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:border-cyan-400/40 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.company}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    item.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' :
                    item.sentiment === 'negative' ? 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30' :
                    'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Articles Today</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Sentiment Change</span>
                    <span className="font-semibold text-emerald-500 dark:text-emerald-400">{item.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6 bg-white dark:bg-[#0B0F1A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Professional Market Toolkit</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">Analytics, sentiment, and signal layers designed for active traders.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>}
              title="Real-Time News"
              description="Live news updates from multiple sources including Google News RSS feeds"
              gradient="from-blue-500 to-cyan-500"
            />
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>}
              title="AI Sentiment Analysis"
              description="FinBERT ML model for accurate financial sentiment prediction (95-98% accuracy)"
              gradient="from-emerald-500 to-teal-500"
            />
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>}
              title="Analytics Dashboard"
              description="Comprehensive analytics with sentiment trends and insights"
              gradient="from-purple-500 to-pink-500"
            />
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>}
              title="AI Chat Assistance"
              description="Intelligent chat powered by Google Gemini LLM with conversation history"
              gradient="from-orange-500 to-red-500"
            />
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>}
              title="Social Media"
              description="Twitter/X feed integration for real-time social sentiment"
              gradient="from-blue-400 to-blue-600"
            />
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>}
              title="Image Vision"
              description="Upload and analyze images with Gemini Vision AI for multimodal insights"
              gradient="from-green-500 to-emerald-500"
            />
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>}
              title="Export Reports"
              description="Download comprehensive reports in PDF, Excel, or CSV formats"
              gradient="from-violet-500 to-purple-500"
            />
            <ServiceCard
              icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>}
              title="Speech to Text"
              description="Voice input with real-time transcription using Web Speech API"
              gradient="from-pink-500 to-rose-500"
            />
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-6 bg-slate-50 dark:bg-[#0F172A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">About NewsInsight</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
                NewsInsight is a cutting-edge platform that combines real-time news aggregation with advanced AI-powered sentiment analysis. 
                We help investors, analysts, and business professionals make informed decisions by providing comprehensive insights into 
                company news and market sentiment.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                Our platform leverages the FinBERT ML model, specifically trained on financial text, to deliver highly accurate sentiment 
                predictions. With support for major Indian and international companies, we provide unparalleled coverage and insights.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                  <h3 className="text-3xl font-bold text-cyan-600 dark:text-cyan-200 mb-2">86-90%</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sentiment Accuracy</p>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">24/7</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Real-Time Updates</p>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                  <h3 className="text-3xl font-bold text-emerald-500 dark:text-emerald-300 mb-2">100+</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Companies Tracked</p>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                  <h3 className="text-3xl font-bold text-orange-500 dark:text-orange-300 mb-2">1000+</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Daily Articles</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <FeatureBox
                title="🎯 Mission"
                description="To democratize access to professional-grade financial news analysis and empower users with AI-driven insights."
              />
              <FeatureBox
                title="🚀 Vision"
                description="To become the leading platform for real-time company news analysis powered by cutting-edge AI technology."
              />
              <FeatureBox
                title="💡 Innovation"
                description="We continuously improve our AI models and add new features based on user feedback and market needs."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section id="contact" className="py-20 px-6 bg-white dark:bg-[#0B0F1A] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full mb-4 text-slate-700 dark:text-cyan-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-semibold">Let's Connect</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Talk to the Desk</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">Need a walkthrough or custom workflow? We will help you set it up.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Contact Info Cards */}
            <div className="md:col-span-2 space-y-4">
              <div className="group p-6 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-cyan-400/40 transition-all duration-300">
                <div className="w-14 h-14 bg-[#0EA5E9] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email Us</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Send us an email anytime</p>
                <a href="mailto:contact@newsinsight.com" className="text-cyan-600 dark:text-cyan-200 hover:text-cyan-500 dark:hover:text-cyan-100 font-semibold text-sm">newsinsight@gmail.com</a>
              </div>

              <div className="group p-6 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-cyan-400/40 transition-all duration-300">
                <div className="w-14 h-14 bg-[#0EA5E9] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Call Us</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Mon-Fri, 9am-6pm IST</p>
                <a href="tel:+911234567890" className="text-cyan-600 dark:text-cyan-200 hover:text-cyan-500 dark:hover:text-cyan-100 font-semibold text-sm">+91 7499418984</a>
              </div>

              <div className="group p-6 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-cyan-400/40 transition-all duration-300">
                <div className="w-14 h-14 bg-[#0EA5E9] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Visit Office</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Come lets meet</p>
                <p className="text-cyan-600 dark:text-cyan-200 font-semibold text-sm">Raigad, Maharashtra, India</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-3">
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-xl p-8 shadow-lg">
                {/* Success/Error Message */}
                {submitMessage.text && (
                  <div className={`mb-6 p-4 rounded-xl border ${
                    submitMessage.type === 'success'
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300'
                  } flex items-start gap-3 animate-fadeIn`}>
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {submitMessage.type === 'success' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <span className="text-sm font-medium">{submitMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={contactForm.fullName}
                        onChange={handleContactInputChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                        placeholder="John Doe"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactInputChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                        placeholder="john@example.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={contactForm.phoneNumber}
                      onChange={handleContactInputChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                      placeholder="+91 98765 43210"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactInputChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                      placeholder="How can we help you?"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactInputChange}
                      rows={5}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us more about your inquiry..."
                      required
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full py-4 bg-[#0EA5E9] text-white rounded-xl font-bold text-lg hover:bg-[#0284C7] shadow-[0_12px_30px_rgba(14,165,233,0.35)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">We'll get back to you within 24 hours</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-slate-50 dark:bg-[#0B0F1A] border-t border-slate-200 dark:border-white/10 text-slate-900 dark:text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#0EA5E9] rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    NEWSINSIGHT
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 tracking-wider">AI-POWERED ANALYTICS</div>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Transform market intelligence with AI-powered sentiment analysis and real-time updates. Make data-driven decisions with confidence.
              </p>
              <div className="flex gap-3">
                <a href="https://x.com/home" className="group w-11 h-11 bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-cyan-500/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/ashish-jumare/" className="group w-11 h-11 bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-cyan-500/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/ashish-jumare/" className="group w-11 h-11 bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-cyan-500/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/ashish-jumare/" className="group w-11 h-11 bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-cyan-500/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('home')} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Home</button></li>
                <li><button onClick={() => scrollToSection('news')} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">News Feed</button></li>
                <li><button onClick={() => scrollToSection('services')} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Services</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">About Us</button></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Pricing</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Documentation</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">API Reference</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Tutorials</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Blog</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Changelog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Help Center</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Contact Us</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Status</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Newsletter</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Get the latest news and updates</p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                />
                <button className="px-4 py-2.5 bg-[#0EA5E9] text-white rounded-xl font-semibold text-sm hover:bg-[#0284C7] hover:shadow-lg transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                © 2025 <span className="text-slate-900 dark:text-white font-semibold">NewsInsight</span>. All rights reserved. Powered by <span className="text-cyan-600 dark:text-cyan-300">FinBERT AI</span>.
              </div>
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cookies</a>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Sitemap</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login/Signup Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8 relative text-slate-900 dark:text-white">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setAuthError('');
                setAuthSuccess('');
                setAuthForm({ fullName: '', email: '', password: '', confirmPassword: '' });
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>

            {/* Success Message */}
            {authSuccess && (
              <div className="mb-4 p-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-200">{authSuccess}</p>
              </div>
            )}

            {/* Error Message */}
            {authError && (
              <div className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-200">{authError}</p>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={authForm.fullName}
                    onChange={handleAuthInputChange}
                    required
                    disabled={authLoading}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1220] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:opacity-50"
                    placeholder="John Doe"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleAuthInputChange}
                  required
                  disabled={authLoading}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1220] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:opacity-50"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={handleAuthInputChange}
                  required
                  disabled={authLoading}
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1220] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
              
              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={authForm.confirmPassword}
                    onChange={handleAuthInputChange}
                    required
                    disabled={authLoading}
                    minLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1220] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignup ? 'Creating Account...' : 'Logging in...'}
                  </>
                ) : (
                  isSignup ? 'Sign Up' : 'Login'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-[#0F172A] text-slate-500 dark:text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme={isDark ? "filled_black" : "outline"}
                size="large"
                width="100%"
                text={isSignup ? "signup_with" : "signin_with"}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  type="button"
                  disabled={authLoading}
                  className="text-cyan-600 dark:text-cyan-200 font-semibold hover:underline disabled:opacity-50"
                >
                  {isSignup ? 'Login' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSettingsSaved={onSettingsChange} 
      />
    </div>
  );
}

function ServiceCard({ icon, title, description, gradient }) {
  return (
    <div className="group relative rounded-2xl p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-cyan-400/40 hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-cyan-500/10 to-blue-500/10"></div>
      <div className="relative z-10">
        <div className="text-cyan-600 dark:text-cyan-200 mb-4 group-hover:-translate-y-1 transition-transform">{icon}</div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm">{description}</p>
      </div>
    </div>
  );
}

function FeatureBox({ title, description }) {
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
