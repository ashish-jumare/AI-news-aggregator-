import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import SettingsModal from '../components/SettingsModal';

export default function HomePage({ onGetStarted, onOpenHelp, onOpenFeedback, onOpenLLM, onSettingsChange }) {
  const { isDark } = useTheme();
  const { user, signup, login, googleLogin, logout, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-[#0F172A] dark:bg-gray-950 backdrop-blur-xl border-b border-[#1E293B] dark:border-gray-800 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-11 h-11 bg-[#1E40AF] dark:bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-white dark:text-blue-400 tracking-tight">
                  NEWSINSIGHT
                </span>
                <div className="text-[10px] text-[#94A3B8] dark:text-gray-500 -mt-1 tracking-wider">AI-POWERED NEWS INTELLIGENCE</div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => scrollToSection('home')}
                className="px-4 py-2 text-[#94A3B8] dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#1E293B] dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
              >
                Home
              </button>
              <button
                onClick={handleNewsClick}
                className="px-4 py-2 text-[#94A3B8] dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#1E293B] dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
              >
                News
              </button>
              <button
                onClick={handleLLMClick}
                className="px-4 py-2 text-[#94A3B8] dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#1E293B] dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
              >
                LLM
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="px-4 py-2 text-[#94A3B8] dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#1E293B] dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="px-4 py-2 text-[#94A3B8] dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#1E293B] dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
              >
                About
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setIsSignup(false);
                      setShowLoginModal(true);
                    }}
                    className="px-5 py-2 text-white hover:text-[#60A5FA] font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsSignup(true);
                      setShowLoginModal(true);
                    }}
                    className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-xl font-semibold hover:bg-[#1E3A8A] hover:shadow-lg transition-all"
                  >
                    Sign Up Free
                  </button>
                </>
              ) : (
                /* Account Button */
                <div className="relative">
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

                  {/* Account Dropdown Menu */}
                  {showAccountMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowAccountMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
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

      {/* Hero Section (Home) */}
      <section id="home" className="pt-28 pb-16 px-6 relative overflow-hidden min-h-screen flex items-center bg-white dark:bg-gray-900">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F1F5F9] via-white to-[#EFF6FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        </div>
        
        {/* Animated Dots Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #1E40AF 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#1E40AF]/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#0F766E]/5 dark:bg-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-20 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFF6FF] dark:bg-blue-900/30 border border-[#BFDBFE] dark:border-blue-700/50 rounded-full">
              <span className="w-2 h-2 bg-[#1E40AF] dark:bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-[#1E40AF] dark:text-blue-400">Real-time Market Intelligence</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0F172A] dark:text-white leading-tight">
              AI-Powered News
              <span className="block mt-2 text-[#1E40AF] dark:text-blue-400">
                Intelligence
              </span>
            </h1>
            
            <p className="text-xl text-[#64748B] dark:text-gray-400 leading-relaxed max-w-xl">
              Harness AI-powered sentiment analysis, real-time updates, and intelligent alerts to stay ahead in the market. Make smarter decisions with NewsInsight.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onGetStarted}
                className="group px-8 py-4 bg-[#1E40AF] dark:bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-[#1E3A8A] dark:hover:bg-blue-700 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                Get Started Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="px-8 py-4 border-2 border-[#E2E8F0] dark:border-gray-700 text-[#0F172A] dark:text-white bg-white dark:bg-gray-800 rounded-xl font-bold text-lg hover:border-[#1E40AF] dark:hover:border-blue-500 hover:text-[#1E40AF] dark:hover:text-blue-400 transition-all duration-300"
              >
                Explore Features
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-[#1E40AF] dark:bg-blue-600 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-sm font-bold text-white">A</div>
                  <div className="w-10 h-10 rounded-full bg-[#0F766E] dark:bg-teal-600 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-sm font-bold text-white">B</div>
                  <div className="w-10 h-10 rounded-full bg-[#1E3A8A] dark:bg-blue-700 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-sm font-bold text-white">C</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0F172A] dark:text-white">10,000+ Users</div>
                  <div className="text-xs text-[#64748B] dark:text-gray-400">Trusted worldwide</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-[#1E40AF] dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0F172A] dark:text-white">4.9/5</div>
                  <div className="text-xs text-[#64748B] dark:text-gray-400">Average rating</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Dashboard Preview */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-gray-700 shadow-xl backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-500">
              <div className="bg-white dark:bg-gray-800 backdrop-blur-xl p-8">
                {/* Browser Bar */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#E2E8F0] dark:border-gray-700">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 px-3 py-1 bg-[#F8FAFC] dark:bg-gray-700 rounded text-xs text-[#64748B] dark:text-gray-400">newsinsight.ai</div>
                </div>
                
                {/* Dashboard Content */}
                <div className="space-y-5">
                  {/* Market Overview Card */}
                  <div className="relative p-5 bg-gradient-to-br from-[#EFF6FF] to-[#F0FDFA] dark:from-blue-900/20 dark:to-teal-900/20 rounded-xl border border-[#BFDBFE] dark:border-blue-800/50 backdrop-blur-sm overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#1E40AF]/10 dark:bg-blue-500/20 rounded-full blur-2xl"></div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <div className="text-sm text-[#64748B] dark:text-gray-400 mb-1">NIFTY 50</div>
                        <div className="text-4xl font-bold text-[#0F172A] dark:text-white">₹22,368</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[#15803D] dark:text-green-400 font-bold text-lg">+347.50</span>
                          <span className="px-2 py-1 bg-[#DCFCE7] dark:bg-green-900/30 text-[#15803D] dark:text-green-400 rounded text-sm font-semibold">+1.58%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#64748B] dark:text-gray-400">Live Updates</div>
                        <div className="flex items-center gap-1 text-[#15803D] dark:text-green-400 mt-1">
                          <span className="w-2 h-2 bg-[#15803D] dark:bg-green-400 rounded-full animate-pulse"></span>
                          <span className="text-xs font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini Chart */}
                  <div className="p-4 bg-[#F8FAFC] dark:bg-gray-700/50 rounded-xl border border-[#E2E8F0] dark:border-gray-600 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#64748B] dark:text-gray-400 font-medium">24H PERFORMANCE</span>
                      <span className="text-xs text-[#15803D] dark:text-green-400 font-semibold">↗ Trending Up</span>
                    </div>
                    <div className="h-24">
                      <svg className="w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(30, 64, 175, 0.3)" />
                            <stop offset="100%" stopColor="rgba(30, 64, 175, 0)" />
                          </linearGradient>
                        </defs>
                        <path d="M0,60 L40,55 L80,50 L120,45 L160,35 L200,30 L240,25 L280,22 L320,18 L360,15 L400,10" 
                          fill="url(#chartGradient)" />
                        <path d="M0,60 L40,55 L80,50 L120,45 L160,35 L200,30 L240,25 L280,22 L320,18 L360,15 L400,10" 
                          stroke="rgb(30, 64, 175)" strokeWidth="2.5" fill="none" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Sentiment Cards Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-[#DCFCE7] dark:bg-green-900/20 rounded-xl border border-[#BBF7D0] dark:border-green-800/50 backdrop-blur-sm hover:scale-105 transition-transform">
                      <div className="text-xs text-[#64748B] dark:text-gray-400 mb-1">Positive</div>
                      <div className="text-2xl font-bold text-[#15803D] dark:text-green-400">68%</div>
                      <div className="text-xs text-[#15803D] dark:text-green-400 mt-1">↑ 12%</div>
                    </div>
                    <div className="p-4 bg-[#FEE2E2] dark:bg-red-900/20 rounded-xl border border-[#FECACA] dark:border-red-800/50 backdrop-blur-sm hover:scale-105 transition-transform">
                      <div className="text-xs text-[#64748B] dark:text-gray-400 mb-1">Negative</div>
                      <div className="text-2xl font-bold text-[#B91C1C] dark:text-red-400">22%</div>
                      <div className="text-xs text-[#B91C1C] dark:text-red-400 mt-1">↓ 8%</div>
                    </div>
                    <div className="p-4 bg-[#F1F5F9] dark:bg-gray-700/50 rounded-xl border border-[#E2E8F0] dark:border-gray-600 backdrop-blur-sm hover:scale-105 transition-transform">
                      <div className="text-xs text-[#64748B] dark:text-gray-400 mb-1">Neutral</div>
                      <div className="text-2xl font-bold text-[#64748B] dark:text-gray-300">10%</div>
                      <div className="text-xs text-[#64748B] dark:text-gray-400 mt-1">→ 0%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Floating Elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#1E40AF]/10 dark:bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#0F766E]/10 dark:bg-teal-500/20 rounded-full blur-3xl"></div>
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
      <div className="relative bg-white dark:bg-gray-800 border-y border-[#E2E8F0] dark:border-gray-700 overflow-hidden">
        <div className="flex animate-scroll">
          {[...companies, ...companies].map((company, index) => (
            <div key={index} className="flex items-center gap-3 px-8 py-4 whitespace-nowrap">
              <span className="text-[#0F172A] dark:text-white font-medium">{company.name}</span>
              <span className={`font-bold ${company.positive ? 'text-[#15803D] dark:text-green-400' : 'text-[#B91C1C] dark:text-red-400'}`}>
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
      <section id="news" className="py-20 px-6 bg-[#F8FAFC] dark:bg-gray-800 border-t border-[#E2E8F0] dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0F172A] dark:text-white mb-4">Latest News Coverage</h2>
            <p className="text-xl text-[#64748B] dark:text-gray-400">Real-time news from multiple sources with AI-powered sentiment analysis</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { company: 'Reliance Industries', sentiment: 'positive', count: 245, change: '+12%' },
              { company: 'Tata Motors', sentiment: 'neutral', count: 189, change: '+5%' },
              { company: 'Infosys', sentiment: 'positive', count: 312, change: '+18%' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-6 hover:shadow-xl border border-[#E2E8F0] dark:border-gray-600 hover:border-[#1E40AF] dark:hover:border-blue-500 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{item.company}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    item.sentiment === 'positive' ? 'bg-[#DCFCE7] dark:bg-green-900/30 text-[#15803D] dark:text-green-400 border border-[#BBF7D0] dark:border-green-700/50' :
                    item.sentiment === 'negative' ? 'bg-[#FEE2E2] dark:bg-red-900/30 text-[#B91C1C] dark:text-red-400 border border-[#FECACA] dark:border-red-700/50' :
                    'bg-[#F1F5F9] dark:bg-gray-600/30 text-[#64748B] dark:text-gray-300 border border-[#E2E8F0] dark:border-gray-600'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B] dark:text-gray-400">Articles Today</span>
                    <span className="font-semibold text-[#0F172A] dark:text-white">{item.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B] dark:text-gray-400">Sentiment Change</span>
                    <span className="font-semibold text-[#15803D] dark:text-green-400">{item.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0F172A] dark:text-white mb-4">Our Services</h2>
            <p className="text-xl text-[#64748B] dark:text-gray-400">AI-powered tools for intelligent news analysis and chat assistance</p>
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
      <section id="about" className="py-20 px-6 bg-[#F8FAFC] dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#0F172A] dark:text-white mb-6">About NewsInsight</h2>
              <p className="text-lg text-[#64748B] dark:text-gray-400 mb-4">
                NewsInsight is a cutting-edge platform that combines real-time news aggregation with advanced AI-powered sentiment analysis. 
                We help investors, analysts, and business professionals make informed decisions by providing comprehensive insights into 
                company news and market sentiment.
              </p>
              <p className="text-lg text-[#64748B] dark:text-gray-400 mb-6">
                Our platform leverages the FinBERT ML model, specifically trained on financial text, to deliver highly accurate sentiment 
                predictions. With support for major Indian and international companies, we provide unparalleled coverage and insights.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#EFF6FF] dark:bg-blue-900/30 rounded-lg p-4 border border-[#BFDBFE] dark:border-blue-800/50">
                  <h3 className="text-3xl font-bold text-[#1E40AF] dark:text-blue-400 mb-2">95-98%</h3>
                  <p className="text-sm text-[#64748B] dark:text-gray-400">Sentiment Accuracy</p>
                </div>
                <div className="bg-[#F5F3FF] dark:bg-purple-900/30 rounded-lg p-4 border border-[#DDD6FE] dark:border-purple-800/50">
                  <h3 className="text-3xl font-bold text-[#7C3AED] dark:text-purple-400 mb-2">24/7</h3>
                  <p className="text-sm text-[#64748B] dark:text-gray-400">Real-Time Updates</p>
                </div>
                <div className="bg-[#DCFCE7] dark:bg-green-900/30 rounded-lg p-4 border border-[#BBF7D0] dark:border-green-800/50">
                  <h3 className="text-3xl font-bold text-[#15803D] dark:text-green-400 mb-2">100+</h3>
                  <p className="text-sm text-[#64748B] dark:text-gray-400">Companies Tracked</p>
                </div>
                <div className="bg-[#FFF7ED] dark:bg-orange-900/30 rounded-lg p-4 border border-[#FED7AA] dark:border-orange-800/50">
                  <h3 className="text-3xl font-bold text-[#C2410C] dark:text-orange-400 mb-2">1000+</h3>
                  <p className="text-sm text-[#64748B] dark:text-gray-400">Daily Articles</p>
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
      <section id="contact" className="py-20 px-6 bg-white dark:bg-gray-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#1E40AF]/10 dark:bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#0F766E]/10 dark:bg-teal-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFF6FF] dark:bg-blue-900/30 border border-[#BFDBFE] dark:border-blue-700/50 rounded-full mb-4">
              <svg className="w-4 h-4 text-[#1E40AF] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-semibold text-[#1E40AF] dark:text-blue-400">Let's Connect</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F172A] dark:text-white mb-4">Get in Touch</h2>
            <p className="text-xl text-[#64748B] dark:text-gray-400 max-w-2xl mx-auto">Have questions? Our team is here to help you get started with NewsInsight.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Contact Info Cards */}
            <div className="md:col-span-2 space-y-4">
              <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-[#E2E8F0] dark:border-gray-700 backdrop-blur-sm hover:border-[#1E40AF] dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-[#1E40AF] dark:bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">Email Us</h3>
                <p className="text-[#64748B] dark:text-gray-400 text-sm mb-3">Send us an email anytime</p>
                <a href="mailto:contact@newsinsight.com" className="text-[#1E40AF] dark:text-blue-400 hover:text-[#1E3A8A] dark:hover:text-blue-300 font-semibold text-sm">newsinsight@gmail.com</a>
              </div>

              <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-[#E2E8F0] dark:border-gray-700 backdrop-blur-sm hover:border-[#1E40AF] dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-[#1E40AF] dark:bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">Call Us</h3>
                <p className="text-[#64748B] dark:text-gray-400 text-sm mb-3">Mon-Fri, 9am-6pm IST</p>
                <a href="tel:+911234567890" className="text-[#1E40AF] dark:text-blue-400 hover:text-[#1E3A8A] dark:hover:text-blue-300 font-semibold text-sm">+91 7499418984</a>
              </div>

              <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-[#E2E8F0] dark:border-gray-700 backdrop-blur-sm hover:border-[#1E40AF] dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-[#1E40AF] dark:bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">Visit Office</h3>
                <p className="text-[#64748B] dark:text-gray-400 text-sm mb-3">Come lets meet</p>
                <p className="text-[#1E40AF] dark:text-blue-400 font-semibold text-sm">Raigad, Maharashtra, India</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E2E8F0] dark:border-gray-700 backdrop-blur-xl p-8 shadow-lg">
                {/* Success/Error Message */}
                {submitMessage.text && (
                  <div className={`mb-6 p-4 rounded-xl border ${
                    submitMessage.type === 'success'
                      ? 'bg-[#DCFCE7] dark:bg-green-900/30 border-[#BBF7D0] dark:border-green-700/50 text-[#15803D] dark:text-green-400'
                      : 'bg-[#FEE2E2] dark:bg-red-900/30 border-[#FECACA] dark:border-red-700/50 text-[#B91C1C] dark:text-red-400'
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
                      <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={contactForm.fullName}
                        onChange={handleContactInputChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-[#E2E8F0] dark:border-gray-600 bg-[#F8FAFC] dark:bg-gray-700 text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1E40AF] dark:focus:ring-blue-500 focus:border-transparent transition-all group-hover:border-[#CBD5E1] dark:group-hover:border-gray-500"
                        placeholder="John Doe"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactInputChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-[#E2E8F0] dark:border-gray-600 bg-[#F8FAFC] dark:bg-gray-700 text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1E40AF] dark:focus:ring-blue-500 focus:border-transparent transition-all group-hover:border-[#CBD5E1] dark:group-hover:border-gray-500"
                        placeholder="john@example.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={contactForm.phoneNumber}
                      onChange={handleContactInputChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#E2E8F0] dark:border-gray-600 bg-[#F8FAFC] dark:bg-gray-700 text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1E40AF] dark:focus:ring-blue-500 focus:border-transparent transition-all group-hover:border-[#CBD5E1] dark:group-hover:border-gray-500"
                      placeholder="+91 98765 43210"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-2">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactInputChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#E2E8F0] dark:border-gray-600 bg-[#F8FAFC] dark:bg-gray-700 text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1E40AF] dark:focus:ring-blue-500 focus:border-transparent transition-all group-hover:border-[#CBD5E1] dark:group-hover:border-gray-500"
                      placeholder="How can we help you?"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactInputChange}
                      rows={5}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#E2E8F0] dark:border-gray-600 bg-[#F8FAFC] dark:bg-gray-700 text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-400 focus:ring-2 focus:ring-[#1E40AF] dark:focus:ring-blue-500 focus:border-transparent transition-all resize-none group-hover:border-[#CBD5E1] dark:group-hover:border-gray-500"
                      placeholder="Tell us more about your inquiry..."
                      required
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full py-4 bg-[#1E40AF] dark:bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-[#1E3A8A] dark:hover:bg-blue-700 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

                  <p className="text-xs text-[#64748B] dark:text-gray-400 text-center">We'll get back to you within 24 hours</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-[#0F172A] dark:bg-gray-950 border-t border-[#1E293B] dark:border-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1E40AF] dark:bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    NEWSINSIGHT
                  </div>
                  <div className="text-[10px] text-[#94A3B8] dark:text-gray-500 -mt-1 tracking-wider">AI-POWERED ANALYTICS</div>
                </div>
              </div>
              <p className="text-[#94A3B8] dark:text-gray-400 text-sm leading-relaxed mb-6">
                Transform market intelligence with AI-powered sentiment analysis and real-time updates. Make data-driven decisions with confidence.
              </p>
              <div className="flex gap-3">
                <a href="https://x.com/home" className="group w-11 h-11 bg-[#1E293B] dark:bg-gray-800 hover:bg-[#1E40AF] dark:hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-[#94A3B8] dark:text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/ashish-jumare/" className="group w-11 h-11 bg-[#1E293B] dark:bg-gray-800 hover:bg-[#1E40AF] dark:hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-[#94A3B8] dark:text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/ashish-jumare/" className="group w-11 h-11 bg-[#1E293B] dark:bg-gray-800 hover:bg-[#1E40AF] dark:hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-[#94A3B8] dark:text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/ashish-jumare/" className="group w-11 h-11 bg-[#1E293B] dark:bg-gray-800 hover:bg-[#1E40AF] dark:hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <svg className="w-5 h-5 text-[#94A3B8] dark:text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('home')} className="text-[#94A3B8] hover:text-white transition-colors text-sm">Home</button></li>
                <li><button onClick={() => scrollToSection('news')} className="text-[#94A3B8] hover:text-white transition-colors text-sm">News Feed</button></li>
                <li><button onClick={() => scrollToSection('services')} className="text-[#94A3B8] hover:text-white transition-colors text-sm">Services</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-[#94A3B8] hover:text-white transition-colors text-sm">About Us</button></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Pricing</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Documentation</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">API Reference</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Tutorials</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Blog</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Changelog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Help Center</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Contact Us</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-[#94A3B8] hover:text-white transition-colors text-sm">Status</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Newsletter</h3>
              <p className="text-[#94A3B8] dark:text-gray-400 text-sm mb-4">Get the latest news and updates</p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="px-4 py-2.5 rounded-xl bg-[#1E293B] dark:bg-gray-800 border border-[#334155] dark:border-gray-700 text-white text-sm placeholder-[#64748B] dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1E40AF] dark:focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button className="px-4 py-2.5 bg-[#1E40AF] dark:bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-[#1E3A8A] dark:hover:bg-blue-700 hover:shadow-lg transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#1E293B] dark:border-gray-900 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-[#64748B] dark:text-gray-400">
                © 2025 <span className="text-white font-semibold">NewsInsight</span>. All rights reserved. Powered by <span className="text-[#1E40AF] dark:text-blue-400">FinBERT AI</span>.
              </div>
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="text-[#64748B] dark:text-gray-400 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-[#64748B] dark:text-gray-400 hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-[#64748B] dark:text-gray-400 hover:text-white transition-colors">Cookies</a>
                <a href="#" className="text-[#64748B] dark:text-gray-400 hover:text-white transition-colors">Sitemap</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login/Signup Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setAuthError('');
                setAuthSuccess('');
                setAuthForm({ fullName: '', email: '', password: '', confirmPassword: '' });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>

            {/* Success Message */}
            {authSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">{authSuccess}</p>
              </div>
            )}

            {/* Error Message */}
            {authError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">{authError}</p>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={authForm.fullName}
                    onChange={handleAuthInputChange}
                    required
                    disabled={authLoading}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="John Doe"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleAuthInputChange}
                  required
                  disabled={authLoading}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
              
              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#1E40AF] dark:bg-blue-600 hover:bg-[#1E3A8A] dark:hover:bg-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  type="button"
                  disabled={authLoading}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline disabled:opacity-50"
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
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer border border-[#E2E8F0] dark:border-gray-700 hover:border-[#1E40AF] dark:hover:border-blue-500 overflow-hidden">
      <div className="absolute inset-0 bg-[#F8FAFC] dark:bg-gray-700/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative z-10">
        <div className="text-[#1E40AF] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">{title}</h3>
        <p className="text-[#64748B] dark:text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function FeatureBox({ title, description }) {
  return (
    <div className="bg-gradient-to-r from-[#EFF6FF] to-[#F5F3FF] dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-6 border border-[#BFDBFE] dark:border-blue-800/50">
      <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-3">{title}</h3>
      <p className="text-[#64748B] dark:text-gray-400">{description}</p>
    </div>
  );
}
