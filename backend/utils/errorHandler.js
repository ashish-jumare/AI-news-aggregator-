// Error handler utility for controllers
const logger = require('./logger');

/**
 * Standard error response handler for controllers
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 * @param {string} message - Custom error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const handleControllerError = (error, res, message = 'An error occurred', statusCode = 500) => {
  logger.error(message, error.message);
  
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  handleControllerError,
  asyncHandler
};
