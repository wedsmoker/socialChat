const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const profilesRoutes = require('./routes/profiles');
const chatroomsRoutes = require('./routes/chatrooms');
const moderationRoutes = require('./routes/moderation');
const tagsRoutes = require('./routes/tags');
const friendsRoutes = require('./routes/friends');
const commentsRoutes = require('./routes/comments');
const chatHandler = require('./socketHandlers/chat');
const { allowGuestSocket } = require('./middleware/auth');
const botService = require('./services/botService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Trust proxy - Required for Railway/Heroku/etc to get real client IP for rate limiting
app.set('trust proxy', 1);

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

// Allow guest access for Socket.io
io.use(allowGuestSocket);

// Rate limiting - General API protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - Strict for auth endpoints (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login attempts per minute
  message: 'Too many login attempts, please try again in a minute.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiting - Post creation (prevents spam)
const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 posts per hour
  message: 'Too many posts created, please slow down.',
});

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postsRoutes); // Post creation limiter applied in routes file
app.use('/api/profiles', profilesRoutes);
app.use('/api/chatrooms', chatroomsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/comments', commentsRoutes);

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

    // Start bot service
    await botService.start();

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
