import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export default function FeedbackPage({ onClose }) {
  const [formData, setFormData] = useState({
    category: 'bug',
    subject: '',
    description: '',
    priority: 'medium',
    email: '',
    attachScreenshot: false
  });

  const [systemInfo, setSystemInfo] = useState({
    browser: '',
    os: '',
    screenResolution: '',
    currentPage: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-detect system information
  useEffect(() => {
    const detectSystemInfo = () => {
      // Detect browser
      const userAgent = navigator.userAgent;
      let browser = 'Unknown';
      if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
        browser = 'Chrome ' + userAgent.match(/Chrome\/(\d+)/)?.[1];
      } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
        browser = 'Safari ' + userAgent.match(/Version\/(\d+)/)?.[1];
      } else if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox ' + userAgent.match(/Firefox\/(\d+)/)?.[1];
      } else if (userAgent.indexOf('Edg') > -1) {
        browser = 'Edge ' + userAgent.match(/Edg\/(\d+)/)?.[1];
      }

      // Detect OS
      let os = 'Unknown';
      if (userAgent.indexOf('Win') > -1) os = 'Windows';
      else if (userAgent.indexOf('Mac') > -1) os = 'macOS';
      else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
      else if (userAgent.indexOf('Android') > -1) os = 'Android';
      else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

      // Screen resolution
      const screenResolution = `${window.screen.width}x${window.screen.height}`;

      // Current page
      const currentPage = window.location.pathname;

      setSystemInfo({
        browser,
        os,
        screenResolution,
        currentPage
      });
    };

    detectSystemInfo();
  }, []);

  const feedbackCategories = [
    { id: 'bug', name: ' Bug Report', description: 'Something is broken or not working' },
    { id: 'feature', name: ' Feature Request', description: 'Suggest new functionality' },
    { id: 'ui', name: ' UI/UX Improvement', description: 'Design suggestions' },
    { id: 'performance', name: ' Performance Issue', description: 'Slow loading or lag' },
    { id: 'data', name: ' Data Accuracy', description: 'Incorrect sentiment, wrong news, etc.' },
    { id: 'general', name: ' General Feedback', description: 'Overall experience' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await axios.post(API_ENDPOINTS.FEEDBACK, {
        ...formData,
        systemInfo
      });

      if (response.data.success) {
        setTicketNumber(response.data.ticketNumber);
        setSubmitted(true);
        console.log('✅ Feedback submitted successfully:', response.data);
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      setSubmitError(error.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      category: 'bug',
      subject: '',
      description: '',
      priority: 'medium',
      email: '',
      attachScreenshot: false
    });
    setSubmitted(false);
    setTicketNumber('');
    setSubmitError('');
  };

  if (submitted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl w-full mx-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-xl">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              ✅ Feedback Submitted!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              Thank you for your feedback. We appreciate you taking the time to help us improve!
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Your Ticket Number</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                {ticketNumber}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Status: <span className="font-semibold text-yellow-600 dark:text-yellow-400">Under Review</span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
              We typically respond within 24-48 hours. You'll receive updates at the email address you provided.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Submit Another
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Send Feedback
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Help us improve by sharing your thoughts, reporting issues, or suggesting features
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
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
            
            {/* Feedback Category */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-800 dark:text-white mb-4">
                What type of feedback do you have? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbackCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.category === cat.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={formData.category === cat.id}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-white mb-1">
                        {cat.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {cat.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-800 dark:text-white mb-3">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                {['low', 'medium', 'high', 'critical'].map((priority) => (
                  <label
                    key={priority}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.priority === priority
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="hidden"
                    />
                    <span className="font-medium capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-800 dark:text-white mb-3">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Brief title for your feedback (e.g., 'Twitter feed not loading')"
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formData.subject.length}/100 characters
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-800 dark:text-white mb-3">
                Tell us more <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={
                  formData.category === 'bug' 
                    ? "Steps to reproduce:\n1. Go to...\n2. Click on...\n3. See error...\n\nExpected: What should happen\nActual: What actually happened"
                    : formData.category === 'feature'
                    ? "Describe the feature you'd like to see:\n\nProblem it solves:\n\nHow you envision it working:"
                    : "Provide detailed information about your feedback..."
                }
                required
                maxLength={1000}
                rows={8}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Email */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-800 dark:text-white mb-3">
                Email for follow-up <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Required - We'll use this to send you updates about your feedback
              </div>
            </div>

            {/* System Info */}
            <div className="mb-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Include system information (helps us debug faster)
                </span>
              </label>
              
              <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Browser:</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-200">{systemInfo.browser}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">OS:</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-200">{systemInfo.os}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Screen:</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-200">{systemInfo.screenResolution}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Page:</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-200">Help & Support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 animate-fadeIn">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-800 dark:text-red-300">{submitError}</span>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.subject || !formData.description || !formData.email || isSubmitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
