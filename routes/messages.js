const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/:userId
// @desc    Get conversation with a specific user
// @access  Private
router.get('/:userId', [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between current user and other user
    const messages = await Message.getConversation(req.user._id, userId, limit, skip);

    // Reverse to show oldest first
    messages.reverse();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    });

    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      success: true,
      messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      otherUser: {
        id: otherUser._id,
        username: otherUser.username,
        avatar: otherUser.avatar,
        isOnline: otherUser.isOnline,
        lastActive: otherUser.lastActive
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', [
  body('receiverId')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
    .trim()
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { receiverId, content } = req.body;

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Can't send message to self
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    await message.save();

    // Populate sender and receiver info
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark a specific message as read
// @access  Private
router.put('/:messageId/read', [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only the receiver can mark the message as read
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    if (!message.isRead) {
      await message.markAsRead();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/messages/conversation/:userId/read
// @desc    Mark all messages in conversation as read
// @access  Private
router.put('/conversation/:userId/read', [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;

    // Mark all unread messages from this user as read
    const result = await Message.markConversationAsRead(userId, req.user._id);

    res.json({
      success: true,
      message: 'Conversation marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/messages/clear/:userId
// @desc    Clear chat history with a specific user
// @access  Private
router.delete('/clear/:userId', [
    param('userId').isMongoId().withMessage('Invalid user ID')
], auth, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const result = await Message.deleteMany({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        });
        
        res.json({ 
            success: true, 
            message: `Chat history cleared. ${result.deletedCount} messages removed.` 
        });

    } catch (error) {
        console.error('Clear chat error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 