const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { z } = require('zod');

const submitFeedbackSchema = z.object({
	body: z.object({
		category: z.enum(['bug', 'feature', 'ui', 'performance', 'data', 'general']),
		subject: z.string().min(1),
		description: z.string().min(1),
		priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
		email: z.string().email(),
		attachScreenshot: z.boolean().optional(),
		systemInfo: z
			.object({
				browser: z.string().optional(),
				os: z.string().optional(),
				screenResolution: z.string().optional(),
				currentPage: z.string().optional()
			})
			.optional()
	}),
	params: z.object({}).optional().default({}),
	query: z.object({}).optional().default({})
});

// Submit feedback (public endpoint)
router.post('/', validate(submitFeedbackSchema), feedbackController.submitFeedback);

// Get feedback by ticket number (public - for tracking)
router.get('/ticket/:ticketNumber', feedbackController.getFeedbackByTicket);

// Admin-only routes
router.use(authMiddleware, adminMiddleware);

// Get all feedback (admin endpoint)
router.get('/', feedbackController.getAllFeedback);

// Get feedback statistics (admin endpoint)
router.get('/stats', feedbackController.getFeedbackStats);

// Get single feedback by ID (admin endpoint)
router.get('/:id', feedbackController.getFeedbackById);

// Update feedback status (admin endpoint)
router.patch('/:id/status', feedbackController.updateFeedbackStatus);

// Delete feedback (admin endpoint)
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
