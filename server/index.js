const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase, query } = require('./db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const profilesRoutes = require('./routes/profiles');
const chatroomsRoutes = require('./routes/chatrooms');
const moderationRoutes = require('./routes/moderation');
const tagsRoutes = require('./routes/tags');
const friendsRoutes = require('./routes/friends');
const commentsRoutes = require('./routes/comments');
const usersRoutes = require('./routes/users');
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

// Bot counter for moderation dashboard
global.botRequestCount = 0;

// Simple request logger - shows visitor activity in Railway logs (no database storage)
app.use((req, res, next) => {
  // Skip logging for static assets (CSS, JS, images) and API health checks
  const isStaticAsset = req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
  const isHealthCheck = req.path === '/health' || req.path === '/api/health';

  if (!isStaticAsset && !isHealthCheck) {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Detect bots by user agent
    const isBot = /bot|crawler|spider|scraper|scanner|curl|wget|python-requests/i.test(userAgent);

    // Detect exploit scanning attempts
    const isScannerPath = /wp-admin|wp-content|\.env|config\.json|\.git|admin\.php|phpinfo|\.sql|backup|database/i.test(req.path);

    // Log to console for Railway logs (simple format)
    console.log(`[${timestamp}] ${req.method} ${req.path} | IP: ${ip}${isBot ? ' [BOT]' : ''}${isScannerPath ? ' [SCANNER]' : ''}`);

    if (isBot || isScannerPath) {
      // Just increment bot counter for stats
      global.botRequestCount++;
    }
  }
  next();
});

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
app.use('/api/users', usersRoutes);

// Set Socket.io for posts route (for live feed)
postsRoutes.setSocketIO(io);
app.use('/api/posts', postsRoutes); // Post creation limiter applied in routes file

app.use('/api/profiles', profilesRoutes);
app.use('/api/chatrooms', chatroomsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/friends', friendsRoutes);

// Set Socket.io for comments route (for real-time comments)
commentsRoutes.setSocketIO(io);
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

    // Pass Socket.io instance to bot service for live updates
    botService.setSocketIO(io);

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
