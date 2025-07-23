const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Create post
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { content } = req.body;
    const media = req.files ? req.files.map(file => ({
      type: file.mimetype.startsWith('image/') ? 'image' : 'video',
      url: `/uploads/${file.filename}`
    })) : [];

    const post = new Post({
      author: req.user._id,
      content,
      media
    });

    await post.save();
    await post.populate('author', 'username avatar');

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    const followingIds = user.following;

    const posts = await Post.find({
      author: { $in: [...followingIds, req.user._id] }
    })
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar')
      .populate('likes', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get explore posts
router.get('/explore', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'username avatar isPrivate')
      .populate('comments.author', 'username avatar')
      .populate('likes', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const user = await User.findById(req.user._id);
    const filteredPosts = posts.filter(post =>
      !post.author.isPrivate ||
      user.following.includes(post.author._id) ||
      post.author._id.equals(req.user._id)
    );

    res.json({ posts: filteredPosts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get posts by user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar')
      .populate('likes', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like or Unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes = post.likes.filter(id => !id.equals(req.user._id));
    } else {
      post.likes.push(req.user._id);

      if (!post.author.equals(req.user._id)) {
        const notification = new Notification({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          message: `${req.user.username} liked your post`,
          relatedPost: post._id
        });
        await notification.save();
      }
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      isLiked: !isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      author: req.user._id,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.author', 'username avatar');

    if (!post.author.equals(req.user._id)) {
      const notification = new Notification({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        message: `${req.user.username} commented on your post`,
        relatedPost: post._id
      });
      await notification.save();
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
