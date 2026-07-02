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

exports.getUsers = async (req, res) => {
  try {
    const { limit = 200, skip = 0, q = '' } = req.query;
    const filter = q
      ? {
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(parseInt(skip, 10))
      .select('fullName email role createdAt lastLogin')
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      total
    });
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load users list',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};
