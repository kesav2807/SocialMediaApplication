const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const chatRoutes = require('./routes/chat');

// Import middleware
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // optional if views is in root

// Root Route - Render UI
app.get('/', (req, res) => {
  res.render('home', {
    title: '🚀 Welcome to the Social App API',
    description: 'Our API is live, secured, and production-ready. Start building with confidence.'
  });
});




// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://kesav2807:Raji2807@cluster0.4k1tgsi.mongodb.net/socialapp');
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);

// Real-time Socket.IO
const connectedUsers = new Map();
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  connectedUsers.set(socket.userId, socket.id);
  socket.broadcast.emit('userOnline', socket.userId);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.userId} left room ${roomId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      if (!data.content || !data.content.trim()) {
        socket.emit('messageError', { error: 'Message content is required' });
        return;
      }

      const Message = require('./models/Message');
      const ChatRoom = require('./models/ChatRoom');

      const message = new Message({
        sender: socket.userId,
        receiver: data.receiver,
        content: data.content.trim(),
        chatRoom: data.chatRoom,
        messageType: data.messageType || 'text'
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      if (data.chatRoom) {
        await ChatRoom.findByIdAndUpdate(data.chatRoom, {
          lastMessage: message._id,
          updatedAt: new Date()
        });

        io.to(data.chatRoom).emit('newMessage', message);
      } else {
        const receiverSocketId = connectedUsers.get(data.receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', message);
        }
      }

      socket.emit('messageSent', message);
    } catch (err) {
      console.error('Socket message error:', err);
      socket.emit('messageError', { error: err.message });
    }
  });

  socket.on('typing', (data) => {
    if (data.chatRoom) {
      socket.to(data.chatRoom).emit('userTyping', { userId: socket.userId, typing: data.typing });
    } else {
      const receiverSocketId = connectedUsers.get(data.receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', { userId: socket.userId, typing: data.typing });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    connectedUsers.delete(socket.userId);
    socket.broadcast.emit('userOffline', socket.userId);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on Port: ${PORT}`);
});
