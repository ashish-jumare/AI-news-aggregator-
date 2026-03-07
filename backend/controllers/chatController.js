const Chat = require('../models/Chat');

// Get all chats for the authenticated user
exports.getAllChats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const chats = await Chat.find({ userId })
      .select('title pinned createdAt updatedAt')
      .sort({ pinned: -1, updatedAt: -1 }) // Pinned first, then by most recent
      .lean();

    res.json({
      success: true,
      count: chats.length,
      chats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats',
      error: error.message
    });
  }
};

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, messages } = req.body;

    const chatData = {
      userId,
      title: title || 'New Chat',
      messages: messages || [],
      pinned: false
    };

    const chat = new Chat(chatData);
    
    // Auto-generate title from first message if not provided
    if (!title && messages && messages.length > 0) {
      chat.generateTitle();
    }
    
    await chat.save();

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      chat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: error.message
    });
  }
};

// Get a specific chat by ID
exports.getChatById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, userId }).lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat',
      error: error.message
    });
  }
};

// Update a chat (add messages, update title)
exports.updateChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;
    const { title, messages, addMessage } = req.body;

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Update title if provided
    if (title !== undefined) {
      chat.title = title;
    }

    // Replace all messages if provided
    if (messages !== undefined) {
      chat.messages = messages;
    }

    // Add a single message if provided
    if (addMessage) {
      chat.messages.push({
        role: addMessage.role,
        content: addMessage.content,
        timestamp: addMessage.timestamp || new Date()
      });
    }

    // Auto-generate title if it's still "New Chat" and we have messages
    if (chat.title === 'New Chat' && chat.messages.length > 0) {
      chat.generateTitle();
    }

    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      message: 'Chat updated successfully',
      chat
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat',
      error: error.message
    });
  }
};

// Delete a chat
exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat',
      error: error.message
    });
  }
};

// Toggle pin status
exports.togglePin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    chat.pinned = !chat.pinned;
    await chat.save();

    res.json({
      success: true,
      message: `Chat ${chat.pinned ? 'pinned' : 'unpinned'} successfully`,
      chat: {
        _id: chat._id,
        title: chat.title,
        pinned: chat.pinned
      }
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle pin',
      error: error.message
    });
  }
};
