// Logger utility for production-safe logging
const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  
  success: (message, ...args) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  },
  
  error: (message, ...args) => {
    // Always log errors, even in production
    console.error(`❌ ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`🐛 ${message}`, ...args);
    }
  }
};

module.exports = logger;
