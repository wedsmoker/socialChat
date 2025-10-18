# Phase 1 Deployment Guide

## What's Been Implemented

### ✅ Guest Access System
**Backend:**
- Guest sessions with unique IDs (e.g., `Guest_a1b2c3d4`)
- Modified auth middleware to allow guest connections
- Socket.io chat support for guests
- Guest messages stored in database with `guest_name` and `guest_id`
- Session management that persists guest identity

**Frontend:**
- Guest banner with login/register prompts
- Hidden post creation UI for guests
- Chat functionality fully enabled for guests
- Auto-redirect to login button for guests

**Features:**
- Guests can view public posts
- Guests can send chat messages with unique guest names
- Guest sessions persist across page refreshes
- Login/register clears guest session and creates authenticated session

---

### ✅ Friends System (Backend Complete)
**Database:**
- `friendships` table with requester/receiver model
- Status tracking (pending, accepted, rejected)
- Proper ID ordering constraint (requester_id < receiver_id)

**API Endpoints:**
- `GET /api/friends` - Get user's accepted friends
- `GET /api/friends/requests` - Get incoming/outgoing pending requests
- `POST /api/friends/request/:userId` - Send friend request
- `POST /api/friends/accept/:friendshipId` - Accept request
- `POST /api/friends/reject/:friendshipId` - Reject request
- `DELETE /api/friends/:friendshipId` - Unfriend/cancel request
- `GET /api/friends/status/:userId` - Check friendship status

**Post Visibility:**
- Public posts: visible to everyone (including guests)
- Friends-only posts: visible only to accepted friends + post author
- Private posts: visible only to post author
- Friends filtering integrated into feed query

---

### ⏳ Pending Frontend Implementation
- Friends UI on profile pages (friend request buttons)
- Friends list display
- Friend request notifications
- Friend status indicators on posts
- Comments system (database schema ready, needs routes + UI)
- Collections/playlists system (database schema ready, needs routes + UI)

---

## Deployment Steps

### 1. Run the Migration

```bash
# Navigate to server directory
cd server

# Run the Phase 1 migration
node runMigration.js
```

This will:
- Add guest support columns to users and chat_messages
- Create friendships table
- Create comments and comment_reactions tables
- Create collections and collection_posts tables
- Create saved_posts table
- Add moderation columns
- Ensure all Phase 0 features (audio, tags, visibility) are set up

### 2. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

### 3. Test Guest Access

1. Open your browser to `http://localhost:3000` (or your deployment URL)
2. You should see the feed without logging in
3. A banner should appear showing your guest name (e.g., "You're browsing as Guest_a1b2c3d4")
4. Try sending a chat message - it should work!
5. Post creation UI should be hidden
6. Click "Login" button to go to login page

### 4. Test Friends System (Backend API)

**Using curl or Postman:**

```bash
# Check friendship status (requires login)
curl http://localhost:3000/api/friends/status/2 \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Send friend request
curl -X POST http://localhost:3000/api/friends/request/2 \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Get pending requests
curl http://localhost:3000/api/friends/requests \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Accept request (as the receiver)
curl -X POST http://localhost:3000/api/friends/accept/1 \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Get friends list
curl http://localhost:3000/api/friends \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### 5. Test Friends-Only Posts

1. Create two accounts and add them as friends
2. Create a post with "Friends Only" visibility
3. Log in as the friend - you should see the post
4. Log out and become a guest - post should be hidden
5. Log in as a non-friend - post should be hidden

---

## Known Limitations (Pending Frontend)

1. **No Friends UI Yet** - Backend is ready, but users can't send friend requests through the UI. You can test via API calls or build the frontend next.

2. **Comments Not Functional** - Database schema exists, but needs:
   - Backend routes (`server/routes/comments.js`)
   - Frontend UI for comment threads
   - Real-time comment updates via Socket.io

3. **Collections Not Functional** - Database schema exists, but needs:
   - Backend routes (`server/routes/collections.js`)
   - Frontend UI for creating/managing collections
   - Add-to-collection buttons on posts

---

## What to Build Next

### Option 1: Friends Frontend (Easiest Path to MVP)
- Add friend request button to profile pages
- Show friend status (Friends, Pending, Not Friends)
- Friend request notifications badge
- Friends list modal/page
- Accept/reject buttons for incoming requests

### Option 2: Comments System
- Backend routes for CRUD operations
- Nested comment threads UI
- Real-time comment updates
- Comment reactions

### Option 3: Collections/Playlists
- Create collection UI
- Add posts to collections
- Browse/share collections
- Collection visibility controls

---

## File Changes Summary

**New Files:**
- `server/migrations/phase1_migration.sql`
- `server/runMigration.js`
- `server/routes/friends.js`
- `PHASE1_DEPLOYMENT.md`

**Modified Files:**
- `server/middleware/auth.js` - Added guest support
- `server/socketHandlers/chat.js` - Guest chat messages
- `server/routes/auth.js` - Guest session detection
- `server/routes/chatrooms.js` - Guest message loading
- `server/routes/posts.js` - Friends visibility filtering
- `server/index.js` - Registered friends routes, guest socket middleware
- `public/js/app.js` - Guest mode UI handling
- `public/css/style.css` - Guest banner styling

---

## Testing Checklist

- [ ] Guest can view the feed without logging in
- [ ] Guest can send chat messages with unique name
- [ ] Guest banner appears with login/register links
- [ ] Post creation UI hidden for guests
- [ ] Login clears guest session
- [ ] Friends system API endpoints respond correctly
- [ ] Friends-only posts hidden from non-friends
- [ ] Public posts visible to everyone including guests
- [ ] Private posts only visible to author
- [ ] Migration runs without errors
- [ ] Chat messages show guest names correctly

---

## Next Steps After Testing

1. **Report any bugs or issues**
2. **Decide which feature to prioritize:**
   - Friends UI (most impactful for social features)
   - Comments system (increases engagement)
   - Collections (for content organization)
3. **Commit the changes once tested**

---

## Rollback Plan

If issues arise, you can rollback the migration by:

1. Drop the new tables:
```sql
DROP TABLE IF EXISTS collection_posts CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS saved_posts CASCADE;
DROP TABLE IF EXISTS comment_reactions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
```

2. Revert column changes:
```sql
ALTER TABLE users DROP COLUMN IF EXISTS is_guest;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS guest_name;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS guest_id;
ALTER TABLE chat_messages ALTER COLUMN user_id SET NOT NULL;
```

3. Restart the server with the old code.

---

## Support

If you encounter issues:
1. Check the server console for error messages
2. Check browser console for frontend errors
3. Verify the migration completed successfully
4. Ensure all dependencies are installed (`npm install`)
5. Check that your .env file has the correct DATABASE_URL

Good luck! 🚀
