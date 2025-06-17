const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const router = express.Router();

// Send a friend request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const recipient = await User.findById(req.params.userId);
    if (!recipient || req.user.id === req.params.userId) {
      return res.status(404).json({ message: 'User not found or you cannot add yourself.' });
    }

    // Check if they are already friends
    if (req.user.friends.includes(recipient._id)) {
      return res.status(400).json({ message: 'You are already friends.' });
    }

    // Check for existing pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { requester: req.user._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user._id }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent or received.' });
    }

    const newRequest = new FriendRequest({
      requester: req.user._id,
      recipient: recipient._id
    });

    await newRequest.save();
    
    // TODO: Emit socket event to notify recipient
    
    res.status(201).json({ message: 'Friend request sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a friend request
router.post('/accept/:requestId', auth, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request || request.recipient.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Request not found or you are not the recipient.' });
    }
    if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request no longer pending.' });
    }

    request.status = 'accepted';
    await request.save();

    // Add users to each other's friends lists
    await User.findByIdAndUpdate(request.requester, { $addToSet: { friends: request.recipient } });
    await User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.requester } });

    // TODO: Emit socket event to notify requester

    res.status(200).json({ message: 'Friend request accepted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline or cancel a friend request
router.post('/decline/:requestId', auth, async (req, res) => {
    try {
        const request = await FriendRequest.findById(req.params.requestId);
        if (!request || (request.recipient.toString() !== req.user.id && request.requester.toString() !== req.user.id)) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        request.status = 'declined';
        await request.save();

        res.status(200).json({ message: 'Friend request declined.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get all of the user's friends
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'username email avatar isOnline lastActive');
        res.json(user.friends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get pending friend requests
router.get('/requests', auth, async (req, res) => {
    try {
        const requests = await FriendRequest.find({ recipient: req.user.id, status: 'pending' })
            .populate('requester', 'username email avatar');
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 