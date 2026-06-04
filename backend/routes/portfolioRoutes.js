const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const portfolioController = require('../controllers/portfolioController');
const validate = require('../middleware/validate');
const { z } = require('zod');

const holdingSchema = z.object({
	symbol: z.string().min(1),
	name: z.string().min(1),
	qty: z.coerce.number().nonnegative(),
	avgCost: z.coerce.number().nonnegative(),
	currentPrice: z.coerce.number().nonnegative()
});

const transactionSchema = z.object({
	symbol: z.string().min(1),
	name: z.string().min(1),
	action: z.enum(['buy', 'sell']),
	qty: z.coerce.number().positive(),
	price: z.coerce.number().positive(),
	executedAt: z.string().optional()
});

const updatePortfolioSchema = z.object({
	body: z.object({
		cashBalance: z.coerce.number().nonnegative().optional(),
		holdings: z.array(holdingSchema).optional(),
		transactions: z.array(transactionSchema).optional()
	}),
	params: z.object({}).optional().default({}),
	query: z.object({}).optional().default({})
});

router.use(authMiddleware);

router.get('/', portfolioController.getPortfolio);
router.put('/', validate(updatePortfolioSchema), portfolioController.updatePortfolio);

module.exports = router;
