# 1SocialChat - Project Context & Documentation

## Project Overview
A fullstack social media platform with integrated real-time chatrooms built with Node.js, Express, PostgreSQL, and Socket.io.

**Live Site**: https://socialchat-production.up.railway.app/
**GitHub**: https://github.com/wedsmoker/socialChat

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (hosted on Railway)
- **Real-time**: Socket.io
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Authentication**: Session-based with bcrypt
- **Deployment**: Railway
- **Media Storage**: Base64 encoding (10MB limit)

## Project Structure
```
1socialChat/
├── server/
│   ├── index.js                 # Main server file
│   ├── db.js                    # Database connection & query helper
│   ├── schema.sql               # Main database schema
│   ├── middleware/
│   │   ├── auth.js              # User authentication middleware
│   │   └── adminAuth.js         # Admin-only authentication
│   ├── routes/
│   │   ├── auth.js              # Login, register, logout, session
│   │   ├── posts.js             # CRUD for posts, reactions
│   │   ├── profiles.js          # User profiles
│   │   ├── chatrooms.js         # Chatroom management
│   │   └── moderation.js        # Admin moderation endpoints
│   ├── socketHandlers/
│   │   └── chat.js              # Real-time chat logic
│   └── migrations/
│       └── add_moderation.sql   # Moderation system migration
├── public/
│   ├── index.html               # Main feed page
│   ├── login.html               # Login/register page
│   ├── profile.html             # User profile page
│   ├── moderation.html          # Admin dashboard
│   ├── css/
│   │   ├── style.css            # Main styles (synthwave theme)
│   │   └── moderation.css       # Admin dashboard styles
│   └── js/
│       ├── app.js               # Main app logic & auth
│       ├── auth.js              # Login/register forms
│       ├── posts.js             # Posts feed functionality
│       ├── profile.js           # Profile page logic
│       ├── chat.js              # Real-time chat client
│       └── moderation.js        # Admin dashboard logic
├── make-admin.js                # Utility to promote users to admin
├── package.json
├── .env                         # Environment variables
└── .gitignore

```

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `username` (VARCHAR(50) UNIQUE)
- `password_hash` (VARCHAR(255))
- `bio` (TEXT)
- `profile_picture` (TEXT) - Base64 or URL
- `links` (JSONB) - Social media links
- `is_admin` (BOOLEAN) - Admin status
- `is_banned` (BOOLEAN) - Ban status
- `banned_at` (TIMESTAMP)
- `banned_by` (INTEGER) - References users(id)
- `created_at` (TIMESTAMP)

### Posts Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References users(id)
- `content` (TEXT) - Max 5000 chars
- `media_type` (VARCHAR(10)) - 'image' or 'video'
- `media_data` (TEXT) - Base64 encoded media
- `deleted_by_mod` (BOOLEAN) - Soft delete flag
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Chatrooms Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(100) UNIQUE)
- `is_global` (BOOLEAN)
- `created_by` (INTEGER) - References users(id)
- `created_at` (TIMESTAMP)

### Chat_Messages Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References users(id)
- `chatroom_id` (INTEGER) - References chatrooms(id)
- `message` (TEXT) - Max 2000 chars
- `deleted_by_mod` (BOOLEAN) - Soft delete flag
- `created_at` (TIMESTAMP)

### Post_Reactions Table
- `id` (SERIAL PRIMARY KEY)
- `post_id` (INTEGER) - References posts(id)
- `user_id` (INTEGER) - References users(id)
- `reaction_type` (VARCHAR(20)) - 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
- `created_at` (TIMESTAMP)
- UNIQUE constraint on (post_id, user_id, reaction_type)

### Reports Table
- `id` (SERIAL PRIMARY KEY)
- `reporter_id` (INTEGER) - References users(id)
- `reported_user_id` (INTEGER) - References users(id)
- `report_type` (VARCHAR(20)) - 'post', 'message', 'user'
- `content_id` (INTEGER) - ID of reported content
- `reason` (TEXT)
- `status` (VARCHAR(20)) - 'pending', 'reviewed', 'resolved'
- `reviewed_by` (INTEGER) - References users(id)
- `reviewed_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

## Core Features

### Authentication & Users
- Username/password authentication (no email required)
- Session-based auth with express-session
- Password hashing with bcrypt
- User profiles with bio, profile picture, and social links
- Avatar generation via ui-avatars.com API

### Posts Feed
- Create posts with text, images, or videos
- Edit and delete own posts
- React to posts (like, love, laugh, wow, sad, angry)
- Scrollable feed (not whole page scroll)
- Media stored as Base64 (10MB limit)
- Post filtering: excludes deleted/banned content

### Real-time Chat
- Socket.io powered real-time messaging
- Global chatroom (always available)
- User-created custom chatrooms
- Live user count per chatroom
- Typing indicators
- Delete own messages
- Minimize/expand chat interface
- Chat fixed at bottom of page

### Moderation System
- **Admin Dashboard** (`/moderation.html`)
  - Statistics overview (pending reports, banned users, total users, removed posts)
  - Reports management (filter by status: pending/reviewed/resolved)
  - User management (ban/unban, view user stats)
- **User Reporting**
  - Report posts (🚩 Report button on non-own posts)
  - Report messages (🚩 Report button on non-own messages)
  - Report users
- **Admin Actions**
  - Ban users (removes all their content)
  - Unban users
  - Delete specific posts
  - Delete specific messages
  - Update report status
- **Admin Authentication**
  - Separate middleware for admin-only routes
  - Admin link only visible to admins in navbar

## API Endpoints

### Auth Routes (`/api/auth`)
- `POST /register` - Create new account
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /me` - Get current user info
- `GET /session` - Get session info (includes admin status)

### Posts Routes (`/api/posts`)
- `GET /` - Get all posts (feed)
- `GET /:id` - Get single post
- `POST /` - Create new post (auth required)
- `PUT /:id` - Edit post (auth required, owner only)
- `DELETE /:id` - Delete post (auth required, owner only)
- `POST /:id/react` - Add reaction (auth required)
- `DELETE /:id/react/:reaction_type` - Remove reaction (auth required)

### Profile Routes (`/api/profiles`)
- `GET /:username` - Get user profile
- `GET /:username/posts` - Get user's posts
- `PUT /` - Update own profile (auth required)

### Chatroom Routes (`/api/chatrooms`)
- `GET /` - Get all chatrooms
- `GET /:id/messages` - Get messages from chatroom
- `POST /` - Create new chatroom (auth required)

### Moderation Routes (`/api/moderation`)
- `POST /report` - Submit report (auth required)
- `GET /reports` - Get all reports (admin only)
- `PUT /reports/:id` - Update report status (admin only)
- `POST /ban/:userId` - Ban user (admin only)
- `POST /unban/:userId` - Unban user (admin only)
- `DELETE /posts/:postId` - Delete post (admin only)
- `DELETE /messages/:messageId` - Delete message (admin only)
- `GET /stats` - Get moderation stats (admin only)
- `GET /users` - Get all users (admin only)

## Socket.io Events

### Client -> Server
- `join_chatroom` - Join a chatroom
- `leave_chatroom` - Leave a chatroom
- `send_message` - Send a message
- `delete_message` - Delete a message
- `typing` - User is typing
- `stop_typing` - User stopped typing

### Server -> Client
- `joined_chatroom` - Confirmation of joining
- `new_message` - New message received
- `message_deleted` - Message was deleted
- `user_typing` - Another user is typing
- `user_stop_typing` - User stopped typing
- `user_count_update` - Update online user count
- `error` - Error message

## Environment Variables (.env)
```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secret-key-change-this
NODE_ENV=production
PORT=3000
```

## Local Development Setup

1. **Install PostgreSQL 18**
   - Download from postgresql.org
   - Create database: `createdb socialchat`

2. **Clone Repository**
   ```bash
   git clone https://github.com/wedsmoker/socialChat.git
   cd socialChat
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Configure Environment**
   - Create `.env` file
   - Set `DATABASE_URL` with your local PostgreSQL credentials
   - Set `SESSION_SECRET` to a random string

5. **Run Database Migrations**
   - Migrations run automatically on server start
   - Schema is in `server/schema.sql`
   - Moderation migration in `server/migrations/add_moderation.sql`

6. **Start Server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

7. **Make Yourself Admin**
   ```bash
   node make-admin.js your_username
   ```

8. **Access Application**
   - Open http://localhost:3000

## Railway Deployment

### Initial Setup
1. Create new project on Railway
2. Add PostgreSQL database
3. Connect GitHub repository
4. Add environment variables:
   - `DATABASE_URL` (auto-generated by PostgreSQL service)
   - `SESSION_SECRET`
   - `NODE_ENV=production`

### Deploy Updates
```bash
git add .
git commit -m "Your commit message"
git push origin main
```
Railway auto-deploys on push to main branch.

### Make User Admin on Railway
1. Go to Railway dashboard
2. Click on PostgreSQL service
3. Go to "Data" tab
4. Run SQL:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE username = 'admin';
   ```

## Common Tasks

### Add New Admin
```bash
node make-admin.js username
```

### Check Running Server Processes (Windows)
```bash
netstat -ano | findstr :3000
```

### Kill Process on Port 3000 (Windows)
```bash
taskkill //F //PID <process_id>
```

### View Database Tables Locally
```bash
psql -U postgres -d socialchat -c "\dt"
```

### Clear Sessions (if users stuck logged in)
Restart the server or clear session store.

## Design Theme
**Synthwave/Neon Cyberpunk**
- Primary colors: Cyan (#00ffff), Pink (#ff00ff)
- Dark background with neon accents
- Glowing effects on buttons and borders
- Hover animations with color shifts

## Known Issues & Solutions

### Port Already in Use
**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`
**Solution**:
```bash
netstat -ano | findstr :3000
taskkill //F //PID <process_id>
```

### Admin Link Not Showing
**Problem**: Made user admin but link doesn't appear
**Solution**: Log out and log back in to refresh session

### Database Migration Not Running
**Problem**: New columns missing after deployment
**Solution**: Check server logs, migrations run automatically on `initDatabase()`

### Media Upload Fails
**Problem**: Images/videos fail to upload
**Solution**: Check file size (max 10MB), ensure Base64 encoding works

## Future Enhancement Ideas
- Email verification
- Password reset functionality
- Direct messaging between users
- Post comments/replies
- Image/video hosting service (instead of Base64)
- Notifications system
- User blocking
- More reaction types
- Rich text editor for posts
- Search functionality
- Post categories/tags
- Dark/light theme toggle

## Important Notes
- **Security**: Change `SESSION_SECRET` in production
- **Media**: Base64 storage is simple but not ideal for production at scale
- **Bans**: Banning a user soft-deletes all their content (deleted_by_mod flag)
- **Reports**: Reports are never deleted, only status changes
- **Passwords**: Never stored in plain text, always hashed with bcrypt
- **Sessions**: Stored in memory (use Redis for production scaling)

## Admin Account
- **Local**: Run `node make-admin.js username` to promote any user
- **Railway**: Run SQL query in Railway dashboard to promote user
- First user created can be manually promoted to admin

## Commit History Highlights
1. Initial project setup with basic structure
2. Added authentication system
3. Implemented posts feed with media support
4. Added real-time chat with Socket.io
5. Created user profiles with customization
6. Added minimize/expand chat controls
7. Implemented live user count
8. Built comprehensive moderation system (latest)

## Contact & Support
- **GitHub Issues**: https://github.com/wedsmoker/socialChat/issues
- **Developer**: Admin (wedsmoker)

---

*Last Updated: 2025-10-17*
*Generated with Claude Code*
