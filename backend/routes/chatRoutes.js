const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// All routes require authentication
router.use(authMiddleware);

// Get all chats for the authenticated user
router.get('/', chatController.getAllChats);

// Create a new chat
router.post('/', chatController.createChat);

// Get a specific chat by ID
router.get('/:chatId', chatController.getChatById);

// Update a chat (add messages, update title, pin/unpin)
router.put('/:chatId', chatController.updateChat);

// Delete a chat
router.delete('/:chatId', chatController.deleteChat);

// Toggle pin status
router.patch('/:chatId/pin', chatController.togglePin);

module.exports = router;
