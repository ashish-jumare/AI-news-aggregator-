const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { z } = require('zod');

const signupSchema = z.object({
	body: z.object({
		fullName: z.string().min(1),
		email: z.string().email(),
		password: z.string().min(6),
		confirmPassword: z.string().min(6)
	}),
	params: z.object({}).optional().default({}),
	query: z.object({}).optional().default({})
});

const loginSchema = z.object({
	body: z.object({
		email: z.string().email(),
		password: z.string().min(6)
	}),
	params: z.object({}).optional().default({}),
	query: z.object({}).optional().default({})
});

const googleSchema = z.object({
	body: z.object({
		credential: z.string().min(1)
	}),
	params: z.object({}).optional().default({}),
	query: z.object({}).optional().default({})
});

// Public routes
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleSchema), authController.googleAuth);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
