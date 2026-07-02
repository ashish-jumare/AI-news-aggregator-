const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.use(authMiddleware, adminMiddleware);

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
