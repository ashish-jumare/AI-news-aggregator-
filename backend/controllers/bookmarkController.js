const Bookmark = require('../models/Bookmark');

// Get all bookmarks for a user
exports.getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await Bookmark.find({ userId })
      .sort({ bookmarkedAt: -1 }) // Latest first
      .lean(); // Return plain JavaScript objects

    res.json({
      success: true,
      count: bookmarks.length,
      bookmarks
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarks',
      error: error.message
    });
  }
};

// Add a new bookmark
exports.addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarkData = {
      userId,
      company: req.body.company,
      title: req.body.title,
      description: req.body.description || '',
      url: req.body.url,
      source: req.body.source || 'Unknown',
      publishedAt: req.body.publishedAt || new Date(),
      sentiment: req.body.sentiment || 'neutral',
      urlToImage: req.body.urlToImage || null
    };

    const bookmark = new Bookmark(bookmarkData);
    await bookmark.save();

    res.status(201).json({
      success: true,
      message: 'Bookmark added successfully',
      bookmark
    });
  } catch (error) {
    // Handle duplicate bookmark error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This article is already bookmarked'
      });
    }

    console.error('Error adding bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bookmark',
      error: error.message
    });
  }
};

// Remove a bookmark
exports.removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url } = req.params;

    const result = await Bookmark.findOneAndDelete({ 
      userId, 
      url: decodeURIComponent(url) 
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove bookmark',
      error: error.message
    });
  }
};

// Check if an article is bookmarked
exports.checkBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url } = req.params;

    const bookmark = await Bookmark.findOne({ 
      userId, 
      url: decodeURIComponent(url) 
    });

    res.json({
      success: true,
      isBookmarked: !!bookmark
    });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check bookmark status',
      error: error.message
    });
  }
};

// Get bookmarks by company
exports.getBookmarksByCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company } = req.params;

    const bookmarks = await Bookmark.find({ 
      userId, 
      company: decodeURIComponent(company) 
    })
      .sort({ bookmarkedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: bookmarks.length,
      company: decodeURIComponent(company),
      bookmarks
    });
  } catch (error) {
    console.error('Error fetching company bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company bookmarks',
      error: error.message
    });
  }
};

// Clear all bookmarks (optional - for testing)
exports.clearAllBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Bookmark.deleteMany({ userId });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} bookmarks`
    });
  } catch (error) {
    console.error('Error clearing bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear bookmarks',
      error: error.message
    });
  }
};
