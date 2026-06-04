const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Contact = require('../models/Contact');
const Portfolio = require('../models/Portfolio');
const Bookmark = require('../models/Bookmark');
const Tweet = require('../models/Tweet');
const Chat = require('../models/Chat');

exports.getOverview = async (req, res) => {
  try {
    const [
      usersCount,
      feedbackCount,
      contactCount,
      portfolioCount,
      bookmarkCount,
      tweetCount,
      chatCount
    ] = await Promise.all([
      User.countDocuments(),
      Feedback.countDocuments(),
      Contact.countDocuments(),
      Portfolio.countDocuments(),
      Bookmark.countDocuments(),
      Tweet.countDocuments(),
      Chat.countDocuments()
    ]);

    const [recentFeedbacks, recentContacts, recentUsers] = await Promise.all([
      Feedback.find()
        .sort({ submittedAt: -1 })
        .limit(5)
        .select('ticketNumber category status email submittedAt')
        .lean(),
      Contact.find()
        .sort({ submittedAt: -1 })
        .limit(5)
        .select('fullName email subject status submittedAt')
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName email role createdAt lastLogin')
        .lean()
    ]);

    res.json({
      success: true,
      stats: {
        users: usersCount,
        feedbacks: feedbackCount,
        contacts: contactCount,
        portfolios: portfolioCount,
        bookmarks: bookmarkCount,
        tweets: tweetCount,
        chats: chatCount
      },
      recent: {
        feedbacks: recentFeedbacks,
        contacts: recentContacts,
        users: recentUsers
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin overview',
      error: error.message
    });
  }
};
