const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

const router = express.Router();

// ------------------ Direct Messages ------------------

// Send direct message
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver,
      content,
      messageType: 'text'
    });

    await message.save();
    await message.populate('sender', 'username avatar');

    res.json({ message: 'Message sent', data: message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get direct messages with a user
router.get('/direct/:userId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start or get direct conversation
router.post('/direct/start', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 });

    res.json({
      conversation: {
        _id: targetUser._id,
        type: 'direct',
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null
      },
      messages
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ------------------ Chat Room (Group) ------------------

// Create chat room
router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    const chatRoom = new ChatRoom({
      name,
      description,
      creator: req.user._id,
      members: [
        { user: req.user._id, role: 'admin' },
        ...memberIds.map(id => ({ user: id, role: 'member' }))
      ]
    });

    await chatRoom.save();
    await chatRoom.populate('members.user', 'username avatar');

    res.status(201).json({ message: 'Chat room created successfully', chatRoom });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join chat room
router.post('/rooms/:id/join', authenticateToken, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });

    const isMember = chatRoom.members.some(m => m.user.equals(req.user._id));
    if (isMember) return res.status(400).json({ message: 'Already a member' });

    chatRoom.members.push({ user: req.user._id, role: 'member' });
    await chatRoom.save();

    res.json({ message: 'Joined chat room successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave chat room
router.post('/rooms/:id/leave', authenticateToken, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });

    chatRoom.members = chatRoom.members.filter(m => !m.user.equals(req.user._id));
    await chatRoom.save();

    res.json({ message: 'Left chat room successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove user (admin only)
router.post('/rooms/:id/remove', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });

    const requester = chatRoom.members.find(m => m.user.equals(req.user._id));
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    chatRoom.members = chatRoom.members.filter(m => !m.user.equals(userId));
    await chatRoom.save();

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change role (admin only)
router.post('/rooms/:id/role', authenticateToken, async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });

    const admin = chatRoom.members.find(m => m.user.equals(req.user._id));
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change roles' });
    }

    const member = chatRoom.members.find(m => m.user.equals(userId));
    if (!member) return res.status(404).json({ message: 'User not found in room' });

    member.role = newRole;
    await chatRoom.save();

    res.json({ message: `Role updated to ${newRole}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to chat room
router.post('/rooms/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { content, mentions } = req.body;
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });

    const isMember = chatRoom.members.some(m => m.user.equals(req.user._id));
    if (!isMember) return res.status(403).json({ message: 'Not a group member' });

    const message = new Message({
      sender: req.user._id,
      chatRoom: req.params.id,
      content,
      mentions,
      messageType: 'text'
    });

    await message.save();
    await message.populate('sender', 'username avatar');
    await message.populate('mentions', 'username');

    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get group messages (paginated)
router.get('/rooms/:id/messages', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });

    const isMember = chatRoom.members.some(m => m.user.equals(req.user._id));
    if (!isMember) return res.status(403).json({ message: 'Not a member of this chat room' });

    const messages = await Message.find({ chatRoom: req.params.id })
      .populate('sender', 'username avatar')
      .populate('mentions', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ------------------ Conversation List ------------------

// Get all conversations (direct + group)
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const directMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { receiver: req.user._id }],
          chatRoom: null
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    await User.populate(directMessages, { path: '_id', select: 'username avatar isOnline' });
    await User.populate(directMessages, { path: 'lastMessage.sender', select: 'username avatar' });

    const groupConversations = await ChatRoom.find({
      'members.user': req.user._id
    })
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' }
      })
      .populate('members.user', 'username avatar')
      .sort({ updatedAt: -1 });

    res.json({ directMessages, groupConversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ------------------ Mentions Search ------------------

router.get('/users/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({ username: new RegExp(query, 'i') }).select('username avatar');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Search error', error: error.message });
  }
});

module.exports = router;
