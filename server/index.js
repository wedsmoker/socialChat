const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const profilesRoutes = require('./routes/profiles');
const chatroomsRoutes = require('./routes/chatrooms');
const moderationRoutes = require('./routes/moderation');
const chatHandler = require('./socketHandlers/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' })); // Support Base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
});

app.use(sessionMiddleware);

// Share session with Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/chatrooms', chatroomsRoutes);
app.use('/api/moderation', moderationRoutes);

// Socket.io connection handler
chatHandler(io);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    console.log('Database initialized');

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
