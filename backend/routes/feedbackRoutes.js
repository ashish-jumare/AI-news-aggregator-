const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Submit feedback (public endpoint)
router.post('/', feedbackController.submitFeedback);

// Get all feedback (admin endpoint)
router.get('/', feedbackController.getAllFeedback);

// Get feedback statistics (admin endpoint)
router.get('/stats', feedbackController.getFeedbackStats);

// Get feedback by ticket number (public - for tracking)
router.get('/ticket/:ticketNumber', feedbackController.getFeedbackByTicket);

// Get single feedback by ID (admin endpoint)
router.get('/:id', feedbackController.getFeedbackById);

// Update feedback status (admin endpoint)
router.patch('/:id/status', feedbackController.updateFeedbackStatus);

// Delete feedback (admin endpoint)
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
