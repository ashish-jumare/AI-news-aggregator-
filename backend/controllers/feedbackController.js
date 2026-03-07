const Feedback = require('../models/Feedback');

// Generate unique ticket number
const generateTicketNumber = () => {
  return `FB-${Date.now().toString().slice(-8)}`;
};

// Submit feedback (public endpoint)
exports.submitFeedback = async (req, res) => {
  try {
    const { category, subject, description, priority, email, attachScreenshot, systemInfo } = req.body;

    // Validate required fields
    if (!category || !subject || !description || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (category, subject, description, email)'
      });
    }

    // Generate unique ticket number
    const ticketNumber = generateTicketNumber();

    const feedbackData = {
      category,
      subject,
      description,
      priority: priority || 'medium',
      email,
      attachScreenshot: attachScreenshot || false,
      systemInfo: systemInfo || {},
      ticketNumber
    };

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    console.log(`✅ New feedback submitted: ${ticketNumber} from ${email}`);

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! We appreciate you taking the time to help us improve.',
      ticketNumber,
      feedback: {
        id: feedback._id,
        ticketNumber: feedback.ticketNumber,
        category: feedback.category,
        status: feedback.status,
        submittedAt: feedback.submittedAt
      }
    });
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback. Please try again.',
      error: error.message
    });
  }
};

// Get all feedback submissions (admin endpoint)
exports.getAllFeedback = async (req, res) => {
  try {
    const { category, status, priority, limit = 50, skip = 0 } = req.query;

    // Build query filter
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const feedbacks = await Feedback.find(filter)
      .sort({ submittedAt: -1 }) // Latest first
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totalCount = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      count: feedbacks.length,
      total: totalCount,
      feedbacks
    });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get feedback by ticket number (public - for users to track their feedback)
exports.getFeedbackByTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const feedback = await Feedback.findOne({ ticketNumber }).lean();

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found with this ticket number'
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get feedback by ID (admin endpoint)
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Update feedback status (admin endpoint)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'under_review', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      feedback
    });
  } catch (error) {
    console.error('❌ Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
      error: error.message
    });
  }
};

// Delete feedback (admin endpoint)
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
};

// Get feedback statistics (admin endpoint)
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    
    // Count by status
    const pendingCount = await Feedback.countDocuments({ status: 'pending' });
    const underReviewCount = await Feedback.countDocuments({ status: 'under_review' });
    const inProgressCount = await Feedback.countDocuments({ status: 'in_progress' });
    const resolvedCount = await Feedback.countDocuments({ status: 'resolved' });
    const closedCount = await Feedback.countDocuments({ status: 'closed' });

    // Count by category
    const bugCount = await Feedback.countDocuments({ category: 'bug' });
    const featureCount = await Feedback.countDocuments({ category: 'feature' });
    const uiCount = await Feedback.countDocuments({ category: 'ui' });
    const performanceCount = await Feedback.countDocuments({ category: 'performance' });
    const dataCount = await Feedback.countDocuments({ category: 'data' });
    const generalCount = await Feedback.countDocuments({ category: 'general' });

    // Count by priority
    const lowPriority = await Feedback.countDocuments({ priority: 'low' });
    const mediumPriority = await Feedback.countDocuments({ priority: 'medium' });
    const highPriority = await Feedback.countDocuments({ priority: 'high' });
    const urgentPriority = await Feedback.countDocuments({ priority: 'urgent' });

    // Get recent feedback (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFeedback = await Feedback.countDocuments({
      submittedAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        total: totalFeedback,
        byStatus: {
          pending: pendingCount,
          under_review: underReviewCount,
          in_progress: inProgressCount,
          resolved: resolvedCount,
          closed: closedCount
        },
        byCategory: {
          bug: bugCount,
          feature: featureCount,
          ui: uiCount,
          performance: performanceCount,
          data: dataCount,
          general: generalCount
        },
        byPriority: {
          low: lowPriority,
          medium: mediumPriority,
          high: highPriority,
          urgent: urgentPriority
        },
        recentWeek: recentFeedback
      }
    });
  } catch (error) {
    console.error('❌ Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
};

module.exports = exports;
