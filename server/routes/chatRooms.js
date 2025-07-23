const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const ChatRoom = require('../models/ChatRoom');

// Promote user to admin
router.patch('/:roomId/role', verifyToken, async (req, res) => {
  const { userId, role } = req.body;
  const { roomId } = req.params;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const member = room.members.find(m => m.user.toString() === userId);
    if (!member) return res.status(400).json({ error: 'User not in group' });

    member.role = role;
    await room.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// Remove user from group
router.delete('/:roomId/users/:userId', verifyToken, async (req, res) => {
  const { roomId, userId } = req.params;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    room.members = room.members.filter(m => m.user.toString() !== userId);
    await room.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});
// Add member to group
router.post('/rooms/:roomId/add', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Only admins can add
    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    if (room.members.includes(userId)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    room.members.push(userId);
    await room.save();
    res.json({ message: 'User added to group' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove member from group (already in your code)
router.post('/rooms/:roomId/remove', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Only admins can remove
    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    room.members = room.members.filter(id => id.toString() !== userId);
    // Optionally, also remove from admins if present
    room.admins = room.admins.filter(id => id.toString() !== userId);
    await room.save();
    res.json({ message: 'User removed from group' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
