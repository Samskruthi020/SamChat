const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users except current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email avatar isOnline lastActive createdAt')
      .sort({ username: 1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search', [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters')
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

    const { q } = req.query;
    
    const users = await User.find({
      _id: { $ne: req.user._id },
      username: { $regex: q, $options: 'i' }
    })
    .select('username email avatar isOnline lastActive')
    .sort({ username: 1 })
    .limit(20);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/online
// @desc    Get online users
// @access  Private
router.get('/online', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      isOnline: true
    })
    .select('username email avatar isOnline lastActive')
    .sort({ lastActive: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email avatar isOnline lastActive createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 