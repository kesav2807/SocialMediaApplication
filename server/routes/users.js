const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Get user profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { username, bio, isPrivate } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate === 'true';
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow/Unfollow user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => !id.equals(targetUser._id));
      targetUser.followers = targetUser.followers.filter(id => !id.equals(currentUser._id));
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      const notification = new Notification({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'follow',
        message: `${currentUser.username} started following you`
      });
      await notification.save();
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users (authenticated)
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('username avatar bio isPrivate').limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notifications
router.get('/notifications/all', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username avatar')
      .populate('relatedPost', 'content')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get followers
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar bio')
      .select('followers');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ followers: user.followers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Public user search (unauthenticated)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username avatar bio').limit(10);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
