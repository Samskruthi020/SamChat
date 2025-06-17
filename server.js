const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const config = require('./config/config');
const { socketAuth } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const friendRoutes = require('./routes/friends');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/auth', limiter);

// CORS middleware
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (config.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
}

// Store connected users
const connectedUsers = new Map();

// Socket.IO authentication middleware
io.use(socketAuth);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected: ${socket.id}`);

  // Store user connection
  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user
  });

  // Update user online status
  User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    lastActive: new Date()
  }).exec();

  // Broadcast user online status to all other users
  socket.broadcast.emit('userOnline', {
    userId: socket.userId,
    username: socket.user.username
  });

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle joining a chat room
  socket.on('joinChat', ({ otherUserId }) => {
    const roomId = [socket.userId, otherUserId].sort().join('-');
    socket.join(roomId);
    console.log(`User ${socket.user.username} joined chat room: ${roomId}`);
  });

  // Handle leaving a chat room
  socket.on('leaveChat', ({ otherUserId }) => {
    const roomId = [socket.userId, otherUserId].sort().join('-');
    socket.leave(roomId);
    console.log(`User ${socket.user.username} left chat room: ${roomId}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, content } = data;

      // Validate input
      if (!receiverId || !content || content.trim().length === 0) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      if (content.length > 1000) {
        socket.emit('error', { message: 'Message too long' });
        return;
      }

      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        socket.emit('error', { message: 'Receiver not found' });
        return;
      }

      // Create message
      const message = new Message({
        sender: socket.userId,
        receiver: receiverId,
        content: content.trim()
      });

      await message.save();

      // Populate sender and receiver info
      await message.populate('sender', 'username avatar');
      await message.populate('receiver', 'username avatar');

      // Room ID for this conversation
      const roomId = [socket.userId, receiverId].sort().join('-');

      // Emit message to the room (both sender and receiver if they're in the room)
      io.to(roomId).emit('newMessage', message);

      // Send notification to receiver if they're online but not in the chat room
      const receiverConnection = connectedUsers.get(receiverId);
      if (receiverConnection) {
        socket.to(receiverId).emit('newNotification', {
          type: 'message',
          from: socket.user.username,
          message: content.length > 50 ? content.substring(0, 50) + '...' : content
        });
      }

      console.log(`Message sent from ${socket.user.username} to ${receiver.username}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ receiverId, isTyping }) => {
    const roomId = [socket.userId, receiverId].sort().join('-');
    socket.to(roomId).emit('userTyping', {
      userId: socket.userId,
      username: socket.user.username,
      isTyping
    });
  });

  // Handle marking messages as read
  socket.on('markAsRead', async ({ senderId }) => {
    try {
      await Message.markConversationAsRead(senderId, socket.userId);
      
      // Notify sender that their messages were read
      const senderConnection = connectedUsers.get(senderId);
      if (senderConnection) {
        socket.to(senderId).emit('messagesRead', {
          readBy: socket.userId,
          readByUsername: socket.user.username
        });
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  });

  // Handle getting online users
  socket.on('getOnlineUsers', () => {
    const onlineUsers = Array.from(connectedUsers.values())
      .filter(conn => conn.user._id.toString() !== socket.userId)
      .map(conn => ({
        id: conn.user._id,
        username: conn.user.username,
        avatar: conn.user.avatar,
        isOnline: true
      }));

    socket.emit('onlineUsers', onlineUsers);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.username} disconnected: ${socket.id}`);

    // Remove user from connected users
    connectedUsers.delete(socket.userId);

    // Update user offline status
    try {
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastActive: new Date()
      });

      // Broadcast user offline status to all other users
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        username: socket.user.username
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: config.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = config.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Client URL: ${config.CLIENT_URL}`);
}); 