const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all bookmarks
router.get('/', bookmarkController.getBookmarks);

// Add a bookmark
router.post('/', bookmarkController.addBookmark);

// Remove a bookmark by URL
router.delete('/url/:url', bookmarkController.removeBookmark);

// Check if article is bookmarked
router.get('/check/:url', bookmarkController.checkBookmark);

// Get bookmarks by company
router.get('/company/:company', bookmarkController.getBookmarksByCompany);

// Clear all bookmarks (optional - for testing)
router.delete('/clear', bookmarkController.clearAllBookmarks);

module.exports = router;
