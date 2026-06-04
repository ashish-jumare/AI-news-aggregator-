const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { z } = require('zod');

const submitContactSchema = z.object({
	body: z.object({
		fullName: z.string().min(1),
		email: z.string().email(),
		phoneNumber: z.string().optional(),
		subject: z.string().min(1),
		message: z.string().min(1)
	}),
	params: z.object({}).optional().default({}),
	query: z.object({}).optional().default({})
});

// Submit contact form (public endpoint)
router.post('/', validate(submitContactSchema), contactController.submitContact);

// Admin-only routes
router.use(authMiddleware, adminMiddleware);

// Get all contacts (admin endpoint)
router.get('/', contactController.getAllContacts);

// Get contact statistics (admin endpoint)
router.get('/stats', contactController.getContactStats);

// Get single contact by ID (admin endpoint)
router.get('/:id', contactController.getContactById);

// Update contact status (admin endpoint)
router.patch('/:id/status', contactController.updateContactStatus);

// Delete a contact (admin endpoint)
router.delete('/:id', contactController.deleteContact);

module.exports = router;
