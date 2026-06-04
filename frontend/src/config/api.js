// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // News endpoints
  NEWS_LIVE: `${API_BASE_URL}/api/news/live`,
  
  // Twitter endpoints
  TWITTER_TWEETS: (companyName) => `${API_BASE_URL}/api/twitter/tweets/${encodeURIComponent(companyName)}`,
  TWITTER_STORED: (companyName) => `${API_BASE_URL}/api/twitter/stored/${encodeURIComponent(companyName)}`,
  
  // Bookmark endpoints
  BOOKMARKS: `${API_BASE_URL}/api/bookmarks`,
  BOOKMARK_CHECK: (newsId, companyName) => `${API_BASE_URL}/api/bookmarks/check/${newsId}/${companyName}`,
  BOOKMARK_COMPANY: (companyName) => `${API_BASE_URL}/api/bookmarks/company/${companyName}`,
  
  // Contact endpoints
  CONTACTS: `${API_BASE_URL}/api/contacts`,
  
  // Feedback endpoints
  FEEDBACK: `${API_BASE_URL}/api/feedback`,
  FEEDBACK_TICKET: (ticketNumber) => `${API_BASE_URL}/api/feedback/ticket/${ticketNumber}`,
  
  // Auth endpoints
  AUTH_SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_GOOGLE: `${API_BASE_URL}/api/auth/google`,
  AUTH_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  AUTH_UPDATE_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  // Gemini AI endpoints
  GEMINI_CHAT: `${API_BASE_URL}/api/gemini/chat`,
  GEMINI_CHAT_STREAM: `${API_BASE_URL}/api/gemini/chat/stream`,
  GEMINI_HEALTH: `${API_BASE_URL}/api/gemini/health`,
  
  // Chat endpoints
  CHATS: `${API_BASE_URL}/api/chats`,
  CHAT_BY_ID: (chatId) => `${API_BASE_URL}/api/chats/${chatId}`,
  CHAT_PIN: (chatId) => `${API_BASE_URL}/api/chats/${chatId}/pin`,

  // Portfolio endpoints
  PORTFOLIO: `${API_BASE_URL}/api/portfolio`,

  // Admin endpoints
  ADMIN_OVERVIEW: `${API_BASE_URL}/api/admin/overview`,
  ADMIN_FEEDBACK_STATUS: (id) => `${API_BASE_URL}/api/feedback/${id}/status`,
  ADMIN_CONTACT_STATUS: (id) => `${API_BASE_URL}/api/contacts/${id}/status`,
};

export default API_BASE_URL;
