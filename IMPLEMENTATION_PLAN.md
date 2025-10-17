# 1SocialChat - Comprehensive Implementation Plan
## Underground Artist Social Platform

**Target Audience:** Underground artists, producers, designers, creative collaborators
**Core Philosophy:** Community-driven discovery, collaboration, and creative sharing

---

## Implementation Phases Overview

### Phase 1: Foundation - Friends & Core Media (Weeks 1-3)
**Deploy Point 1:** Friends system + Audio posts + Tags
- ✅ Essential social features
- ✅ Audio sharing capability
- ✅ Basic discovery

### Phase 2: Engagement & Discovery (Weeks 4-6)
**Deploy Point 2:** Comments + Collections + Embeds
- ✅ Enhanced interaction
- ✅ Content organization
- ✅ External platform integration

### Phase 3: Community Building (Weeks 7-9)
**Deploy Point 3:** Collaboration + Verification + Advanced Discovery
- ✅ Professional networking
- ✅ Trust & credibility
- ✅ Intelligent recommendations

### Phase 4: Professional Tools (Weeks 10-12)
**Deploy Point 4:** File sharing + Tutorial system + Support features
- ✅ Professional workflows
- ✅ Educational content
- ✅ Artist monetization

### Phase 5: Advanced Social (Weeks 13-15)
**Deploy Point 5:** Crews/Groups + Live features + Remix chains
- ✅ Advanced community structures
- ✅ Real-time collaboration
- ✅ Creative attribution

### Phase 6: Polish & Scale (Weeks 16-18)
**Deploy Point 6:** PWA + Algorithmic feed + Performance optimization
- ✅ Production-ready
- ✅ Mobile experience
- ✅ Scalability

---

# PHASE 1: FOUNDATION - FRIENDS & CORE MEDIA

## 🎯 Deploy Point 1 Goals
- Users can send/accept friend requests
- Users can create friends-only posts
- Users can upload and share audio tracks
- Users can discover content via tags/hashtags
- Users can create multi-media posts

---

## Feature 1.1: Friends System (Option 2 - Single-Row Model)

### Database Schema
```sql
-- Migration: add_friends_system.sql
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ensure_requester_less_than_receiver CHECK (requester_id < receiver_id),
    CONSTRAINT unique_friendship UNIQUE (requester_id, receiver_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_receiver ON friendships(receiver_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Add visibility column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'
    CHECK (visibility IN ('public', 'friends', 'private'));
CREATE INDEX idx_posts_visibility ON posts(visibility);
```

### Backend Implementation

#### New Route: `server/routes/friends.js`
```javascript
// GET /api/friends - Get user's friends list
// GET /api/friends/requests - Get pending friend requests
// POST /api/friends/request/:userId - Send friend request
// POST /api/friends/accept/:friendshipId - Accept request
// POST /api/friends/reject/:friendshipId - Reject request
// DELETE /api/friends/:friendshipId - Unfriend/Cancel request
// GET /api/friends/status/:userId - Check friendship status with user
```

**Key Functions:**
- `getFriendsList()` - Returns accepted friends with user details
- `getPendingRequests()` - Returns incoming and outgoing pending requests
- `sendFriendRequest()` - Creates friendship record with proper ID ordering
- `acceptFriendRequest()` - Updates status to 'accepted'
- `rejectFriendRequest()` - Updates status to 'rejected'
- `removeFriend()` - Deletes friendship record
- `checkFriendshipStatus()` - Returns current status between two users

#### Update: `server/routes/posts.js`
```javascript
// Modify GET /api/posts endpoint
// Add friendship filtering logic:
// - Show all public posts
// - Show friends-only posts if users are friends
// - Show private posts only if post is user's own
// - Add query parameter ?filter=friends to show only friends' posts

// Update POST /api/posts to accept visibility field
```

### Frontend Implementation

#### New File: `public/js/friends.js`
**Components:**
- Friend request button (on profile pages)
- Friend request notification badge (navbar)
- Friends list modal/page
- Pending requests section (incoming/outgoing)
- Friend status indicator

**Functions:**
- `sendFriendRequest(userId)`
- `acceptFriendRequest(friendshipId)`
- `rejectFriendRequest(friendshipId)`
- `removeFriend(friendshipId)`
- `loadFriendsList()`
- `loadPendingRequests()`
- `updateFriendRequestBadge()`

#### Update: `public/js/posts.js`
- Add visibility selector dropdown when creating posts (Public/Friends/Private)
- Add visual indicator on posts showing visibility level
- Add "Friends Feed" filter toggle

#### Update: `public/profile.html`
- Add friend request button (states: Add Friend, Pending, Friends, Accept Request)
- Add friends count display
- Add friends list tab/section

#### Update: `public/index.html`
- Add friend request notification badge to navbar
- Add filter toggle: All Posts / Friends Only
- Add visibility icons on post cards

### Testing Checklist
- [ ] User A can send friend request to User B
- [ ] User B receives notification and can accept/reject
- [ ] Accepted friends appear in both users' friends lists
- [ ] Users can unfriend each other
- [ ] Friends-only posts only visible to friends
- [ ] Private posts only visible to post owner
- [ ] Public posts visible to everyone
- [ ] Friend request badge updates in real-time
- [ ] Cannot send duplicate friend requests
- [ ] Friendship persists after logout/login

---

## Feature 1.2: Audio Posts

### Database Schema
```sql
-- Migration: add_audio_support.sql
-- Update posts table to support audio
ALTER TABLE posts ALTER COLUMN media_type TYPE VARCHAR(20);
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_media_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_media_type_check
    CHECK (media_type IN ('image', 'video', 'audio', NULL));

-- Add audio-specific metadata
ALTER TABLE posts ADD COLUMN IF NOT EXISTS audio_duration INTEGER; -- in seconds
ALTER TABLE posts ADD COLUMN IF NOT EXISTS audio_format VARCHAR(10); -- mp3, wav, ogg
ALTER TABLE posts ADD COLUMN IF NOT EXISTS audio_title VARCHAR(255);
```

### Backend Implementation

#### Update: `server/routes/posts.js`
```javascript
// Update POST /api/posts to handle audio uploads
// - Accept audio/* MIME types
// - Store as Base64 (temp solution) or switch to file storage
// - Extract audio metadata (duration, format)
// - Enforce 20MB limit for audio files
// - Support formats: MP3, WAV, OGG, FLAC
```

**Audio Processing:**
- Validate audio format
- Extract duration using metadata
- Compress if necessary (optional)
- Generate waveform data (future enhancement)

### Frontend Implementation

#### Update: `public/js/posts.js`
**New Components:**
- Audio file upload input
- Custom audio player UI with waveform (use WaveSurfer.js or similar)
- Playback controls (play/pause, seek, volume)
- Duration display
- Download button (artist-controlled via post settings)

**Functions:**
- `uploadAudioPost(audioFile, content, visibility)`
- `createAudioPlayer(audioData)`
- `handleAudioPlayback(postId)`
- `toggleAudioDownload(postId, enabled)`

**Audio Player Features:**
- Inline player on feed
- Play/pause toggle
- Progress bar with seek
- Time display (current / total)
- Volume control
- Waveform visualization (Phase 2 enhancement)

#### Update: `public/css/style.css`
- Custom audio player styling (synthwave theme)
- Waveform visualization styles
- Audio post card design
- Play button animations

### Testing Checklist
- [ ] Users can upload MP3, WAV, OGG files
- [ ] Audio posts display custom player
- [ ] Playback works correctly
- [ ] Seeking/scrubbing works
- [ ] Volume control works
- [ ] Duration displays correctly
- [ ] Multiple audio players don't conflict
- [ ] Audio respects visibility settings
- [ ] Download button works (if enabled)
- [ ] Mobile audio playback works

---

## Feature 1.3: Tags & Hashtag System

### Database Schema
```sql
-- Migration: add_tags_system.sql
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    use_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS post_tags (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, tag_id)
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_use_count ON tags(use_count DESC);
CREATE INDEX idx_post_tags_post ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- Add genre/category support
ALTER TABLE posts ADD COLUMN IF NOT EXISTS genre VARCHAR(50);
```

### Backend Implementation

#### New Route: `server/routes/tags.js`
```javascript
// GET /api/tags - Get all tags (paginated)
// GET /api/tags/trending - Get trending tags (by use_count)
// GET /api/tags/:tagName/posts - Get posts with specific tag
// POST /api/tags - Create new tag (auto-created on post)
// GET /api/tags/search?q=query - Search tags
```

**Key Functions:**
- `parseHashtags(content)` - Extract #hashtags from post content
- `createOrGetTags(tagNames)` - Get existing or create new tags
- `associateTagsWithPost(postId, tagIds)` - Link tags to post
- `getTrendingTags(limit)` - Get most used tags
- `getPostsByTag(tagName)` - Filter posts by tag

#### Update: `server/routes/posts.js`
```javascript
// Modify POST /api/posts
// - Parse hashtags from content
// - Create/link tags automatically
// - Increment tag use_count

// Modify GET /api/posts
// - Join with post_tags and tags
// - Include tags in post response
// - Add ?tag=tagname filter parameter
```

### Frontend Implementation

#### New File: `public/js/tags.js`
**Components:**
- Tag input/suggestion system
- Clickable hashtags in post content
- Tag filter sidebar
- Trending tags widget
- Tag search autocomplete

**Functions:**
- `parseAndLinkifyHashtags(content)` - Convert #hashtags to clickable links
- `loadTrendingTags()`
- `filterPostsByTag(tagName)`
- `searchTags(query)`
- `suggestTags(input)` - Autocomplete for tag input

#### New Page: `public/explore.html`
**Browse by Tags:**
- Trending tags section
- All tags alphabetically
- Tag cloud visualization
- Filter by genre/category
- Search tags

#### Update: `public/index.html`
- Add trending tags sidebar widget
- Make hashtags in posts clickable
- Add tag filter chips (active tags)
- Tag-based feed filtering

#### Update: `public/js/posts.js`
- Add genre/category selector on post creation
- Add manual tag input (in addition to hashtags)
- Display tags on post cards
- Tag click → filter feed by that tag

### Testing Checklist
- [ ] Hashtags automatically extracted from post content
- [ ] Hashtags are clickable and filter posts
- [ ] Trending tags display correctly
- [ ] Tag search/autocomplete works
- [ ] Multiple tags per post supported
- [ ] Tag use count increments/decrements correctly
- [ ] Explore page shows all tags
- [ ] Genre filtering works
- [ ] Tags work with visibility settings (friends-only tagged posts)
- [ ] Special characters in tags handled properly

---

## Feature 1.4: Multi-Media Posts

### Database Schema
```sql
-- Migration: add_multi_media_posts.sql
CREATE TABLE IF NOT EXISTS post_media (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
    media_data TEXT NOT NULL,
    media_order INTEGER DEFAULT 0,
    media_title VARCHAR(255),
    audio_duration INTEGER,
    audio_format VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_order ON post_media(media_order);

-- Deprecate single media columns in posts table (keep for backward compatibility)
-- New posts will use post_media table
```

### Backend Implementation

#### Update: `server/routes/posts.js`
```javascript
// Modify POST /api/posts
// - Accept array of media files
// - Support mixed media types (image + audio, multiple images, etc.)
// - Store each media item in post_media table
// - Maintain order for gallery display
// - Enforce limits: max 10 media items per post, max 50MB total

// Modify GET /api/posts
// - Join with post_media table
// - Include all media items in response
// - Order by media_order
```

**Key Functions:**
- `uploadMultipleMedia(files, postId)` - Handle multiple uploads
- `validateMediaMix(mediaTypes)` - Ensure valid combinations
- `reorderPostMedia(postId, newOrder)` - Update display order

### Frontend Implementation

#### Update: `public/js/posts.js`
**Components:**
- Multi-file upload interface (drag & drop)
- Media gallery carousel/grid
- Media reordering interface (before posting)
- Mixed media player (image gallery + audio player)

**Functions:**
- `handleMultipleMediaUpload(files)`
- `createMediaGallery(mediaItems)`
- `createCarouselView(mediaItems)`
- `previewMediaBeforePost(files)`
- `reorderMedia(mediaArray)`

**Gallery Features:**
- Thumbnail grid for images
- Lightbox/modal view
- Swipe/arrow navigation
- Audio player embedded in gallery
- Caption per media item (optional)

#### Update: `public/css/style.css`
- Gallery/carousel styling
- Image grid layouts
- Lightbox modal
- Media upload preview area
- Drag & drop zone styling

### Testing Checklist
- [ ] Upload multiple images in one post
- [ ] Upload multiple audio files in one post
- [ ] Mix images and audio in one post
- [ ] Gallery displays correctly
- [ ] Navigation between media items works
- [ ] Media order persists
- [ ] Reordering works before posting
- [ ] Lightbox/modal works for images
- [ ] Audio players work in multi-media posts
- [ ] Total size limit enforced (50MB)

---

## Phase 1 Deploy Point Checklist

### Pre-Deployment Tasks
- [ ] All migrations tested locally
- [ ] All features tested individually
- [ ] Integration testing complete
- [ ] Database backup created
- [ ] Migration rollback plan prepared

### Deployment Steps
1. [ ] Run migrations on Railway PostgreSQL
2. [ ] Deploy updated backend code
3. [ ] Clear CDN cache (if applicable)
4. [ ] Verify database schema updates
5. [ ] Test friend requests on production
6. [ ] Test audio uploads on production
7. [ ] Test tag system on production
8. [ ] Monitor error logs for 24 hours

### Success Metrics
- [ ] Friend requests working without errors
- [ ] Audio playback functional
- [ ] Tags searchable and trending
- [ ] No performance degradation
- [ ] User feedback collected

---

# PHASE 2: ENGAGEMENT & DISCOVERY

## 🎯 Deploy Point 2 Goals
- Users can comment on posts with nested replies
- Users can create and share collections/playlists
- Posts can embed external content (YouTube, SoundCloud, etc.)
- Enhanced post interaction and content organization

---

## Feature 2.1: Nested Comments System

### Database Schema
```sql
-- Migration: add_comments_system.sql
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    deleted_by_mod BOOLEAN DEFAULT FALSE,
    edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comment_reactions (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id, reaction_type)
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);

-- Add to reports table for comment reporting
ALTER TABLE reports ADD COLUMN IF NOT EXISTS comment_id INTEGER REFERENCES comments(id);
```

### Backend Implementation

#### New Route: `server/routes/comments.js`
```javascript
// GET /api/posts/:postId/comments - Get all comments for post (nested structure)
// POST /api/posts/:postId/comments - Create new comment
// POST /api/comments/:commentId/reply - Reply to comment (nested)
// PUT /api/comments/:commentId - Edit comment (owner only)
// DELETE /api/comments/:commentId - Delete comment (owner only)
// POST /api/comments/:commentId/react - Add reaction to comment
// DELETE /api/comments/:commentId/react/:reactionType - Remove reaction
```

**Key Functions:**
- `getNestedComments(postId)` - Recursive query to build comment tree
- `createComment(postId, userId, content, parentId)` - Create comment or reply
- `deleteComment(commentId, userId)` - Soft delete with cascade to replies
- `getCommentDepth(commentId)` - Limit nesting to 3-5 levels max

**Comment Structure:**
```javascript
{
  id: 1,
  content: "Great track!",
  user: { username, profile_picture },
  reactions: { like: 5, love: 2 },
  userReaction: "like",
  created_at: "...",
  edited: false,
  replies: [
    { id: 2, content: "Thanks!", parent_comment_id: 1, ... }
  ]
}
```

### Frontend Implementation

#### New File: `public/js/comments.js`
**Components:**
- Comment input box (under posts)
- Comment thread display (nested)
- Reply button and reply form
- Edit/delete options (own comments)
- Comment reactions
- Load more comments button

**Functions:**
- `loadComments(postId)`
- `renderCommentThread(comments, depth)`
- `submitComment(postId, content, parentId)`
- `editComment(commentId, newContent)`
- `deleteComment(commentId)`
- `reactToComment(commentId, reactionType)`

**UX Features:**
- Collapse/expand reply threads
- "View more replies" for long threads
- @mention support (future)
- Time ago format (2h ago, 3d ago)
- Edit indicator ("edited")
- Depth indicator (indentation)

#### Update: `public/index.html`
- Add comments section to post cards
- Show comment count
- Expand comments on click
- Inline comment input

#### Update: `public/css/style.css`
- Nested comment styling (indentation)
- Thread lines/connectors
- Comment reaction pills
- Reply button styling
- Edit/delete icon buttons

### Testing Checklist
- [ ] Users can comment on posts
- [ ] Users can reply to comments (nested)
- [ ] Nested comments display with proper indentation
- [ ] Comments can be edited (by owner)
- [ ] Comments can be deleted (by owner)
- [ ] Reactions work on comments
- [ ] Comment count updates correctly
- [ ] Long threads collapse/expand
- [ ] Respect privacy (can't comment on posts you can't see)
- [ ] Moderation can delete comments

---

## Feature 2.2: Collections & Playlists

### Database Schema
```sql
-- Migration: add_collections.sql
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    collection_type VARCHAR(20) DEFAULT 'general' CHECK (collection_type IN ('general', 'audio_playlist', 'gallery')),
    cover_image TEXT, -- Optional cover image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    item_order INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, post_id)
);

CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_public ON collections(is_public);
CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_collection_items_order ON collection_items(item_order);
```

### Backend Implementation

#### New Route: `server/routes/collections.js`
```javascript
// GET /api/collections - Get user's collections
// GET /api/collections/:id - Get single collection with items
// POST /api/collections - Create new collection
// PUT /api/collections/:id - Update collection details
// DELETE /api/collections/:id - Delete collection
// POST /api/collections/:id/items - Add post to collection
// DELETE /api/collections/:id/items/:postId - Remove post from collection
// PUT /api/collections/:id/reorder - Reorder collection items
// GET /api/users/:username/collections - Get public collections for user
```

**Key Functions:**
- `createCollection(userId, name, description, type, isPublic)`
- `addToCollection(collectionId, postId, order)`
- `removeFromCollection(collectionId, postId)`
- `reorderCollection(collectionId, newOrder)`
- `getCollectionItems(collectionId)` - Returns posts in order

**Collection Types:**
- **General**: Mixed content
- **Audio Playlist**: Audio posts only (playback queue)
- **Gallery**: Image posts only

### Frontend Implementation

#### New File: `public/js/collections.js`
**Components:**
- Collections sidebar/page
- "Add to Collection" button on posts
- Collection modal (select or create new)
- Collection detail view
- Playlist player (for audio collections)
- Reorder interface (drag & drop)

**Functions:**
- `loadUserCollections()`
- `createCollection(name, description, type)`
- `addPostToCollection(postId, collectionId)`
- `removePostFromCollection(postId, collectionId)`
- `viewCollection(collectionId)`
- `playAudioPlaylist(collectionId)` - Queue and play audio posts

**Playlist Player Features:**
- Auto-play next track
- Shuffle mode
- Repeat mode
- Skip forward/back
- Full playlist view

#### New Page: `public/collections.html`
- User's collections grid
- Public vs private toggle
- Create new collection button
- Collection cards with cover images
- Sort options (date, name, size)

#### Update: `public/index.html` & `public/profile.html`
- Add "Add to Collection" button on post cards
- Show collection count on profile
- Link to user's public collections

### Testing Checklist
- [ ] Users can create collections
- [ ] Users can add posts to collections
- [ ] Collections can be public or private
- [ ] Reordering works
- [ ] Audio playlists play in order
- [ ] Remove from collection works
- [ ] Collection covers display
- [ ] Empty collections handled gracefully
- [ ] Deleting post removes from collections
- [ ] Public collections visible on profiles

---

## Feature 2.3: External Embeds

### Database Schema
```sql
-- Migration: add_embeds.sql
CREATE TABLE IF NOT EXISTS post_embeds (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    embed_type VARCHAR(30) NOT NULL CHECK (embed_type IN ('youtube', 'soundcloud', 'bandcamp', 'spotify', 'vimeo', 'twitch', 'generic')),
    embed_url TEXT NOT NULL,
    embed_data JSONB, -- Store oEmbed data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_embeds_post ON post_embeds(post_id);
CREATE INDEX idx_post_embeds_type ON post_embeds(embed_type);
```

### Backend Implementation

#### Update: `server/routes/posts.js`
```javascript
// Modify POST /api/posts
// - Accept optional embed_urls array
// - Validate and parse URLs
// - Fetch oEmbed data where available
// - Store embed metadata

// Add helper functions:
// - detectEmbedType(url) - Identify platform from URL
// - fetchOEmbedData(url, type) - Get embed metadata
// - generateEmbedHTML(embedData) - Server-side embed generation
```

**Supported Platforms:**
- YouTube (video)
- SoundCloud (audio)
- Bandcamp (audio/albums)
- Spotify (tracks/playlists)
- Vimeo (video)
- Twitch (clips/VODs)

**oEmbed Integration:**
- Fetch title, thumbnail, duration
- Cache embed data
- Fallback to iframe embeds

### Frontend Implementation

#### Update: `public/js/posts.js`
**Components:**
- URL input field (auto-detect embeds)
- Embed preview before posting
- Embedded players in feed
- Platform-specific styling

**Functions:**
- `parseEmbedUrl(url)` - Client-side URL validation
- `previewEmbed(url)` - Show embed preview
- `renderEmbed(embedData)` - Display embedded content
- `loadEmbedScripts()` - Load platform SDKs (YouTube API, etc.)

**Embed Features:**
- Auto-detect URLs in post content
- Preview before posting
- Responsive embed sizing
- Platform branding
- "Open in [Platform]" link

#### Update: `public/css/style.css`
- Embed container styling
- Responsive iframe sizing
- Platform-specific themes
- Loading placeholders

### Testing Checklist
- [ ] YouTube URLs embed correctly
- [ ] SoundCloud URLs embed correctly
- [ ] Bandcamp URLs embed correctly
- [ ] Spotify URLs embed correctly
- [ ] Multiple embeds per post supported
- [ ] Embeds responsive on mobile
- [ ] Invalid URLs handled gracefully
- [ ] oEmbed data fetched and cached
- [ ] Embeds work with visibility settings
- [ ] Platform SDKs load without conflicts

---

## Feature 2.4: Enhanced Post Interactions

### Database Schema
```sql
-- Migration: add_post_interactions.sql
-- Bookmarks/Saves
CREATE TABLE IF NOT EXISTS saved_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Shares/Reposts
CREATE TABLE IF NOT EXISTS post_shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    share_comment TEXT, -- Optional comment when sharing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX idx_saved_posts_post ON saved_posts(post_id);
CREATE INDEX idx_post_shares_user ON post_shares(user_id);
CREATE INDEX idx_post_shares_post ON post_shares(post_id);

-- Add share count to posts (denormalized for performance)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
```

### Backend Implementation

#### Update: `server/routes/posts.js`
```javascript
// POST /api/posts/:id/save - Save/bookmark post
// DELETE /api/posts/:id/save - Unsave post
// GET /api/saved - Get user's saved posts
// POST /api/posts/:id/share - Share/repost
// GET /api/posts/:id/shares - Get share count and users
```

### Frontend Implementation

#### Update: `public/js/posts.js`
**New Features:**
- Bookmark button on posts
- Share button with modal
- Saved posts page/section
- Share count display
- Share with comment feature

### Testing Checklist
- [ ] Users can save/bookmark posts
- [ ] Saved posts page displays correctly
- [ ] Unsave works
- [ ] Share creates new post reference
- [ ] Share count increments
- [ ] Share with comment works
- [ ] Saved posts respect visibility
- [ ] Shares appear in feed

---

## Phase 2 Deploy Point Checklist

### Pre-Deployment Tasks
- [ ] Comments system tested (nested replies)
- [ ] Collections tested (all types)
- [ ] Embeds tested (all platforms)
- [ ] Save/share tested
- [ ] Performance testing (complex queries)
- [ ] Database backup created

### Deployment Steps
1. [ ] Run Phase 2 migrations
2. [ ] Deploy backend updates
3. [ ] Test comments on production
4. [ ] Test collections on production
5. [ ] Test embeds on production
6. [ ] Monitor query performance

### Success Metrics
- [ ] Comments load quickly (<500ms)
- [ ] Collections functional
- [ ] Embeds render correctly
- [ ] No N+1 query issues
- [ ] User engagement increases

---

# PHASE 3: COMMUNITY BUILDING

## 🎯 Deploy Point 3 Goals
- Users can find and request collaborators
- Verified artist badges establish credibility
- Algorithm recommends relevant content
- Enhanced discovery mechanisms

---

## Feature 3.1: Collaboration Hub

### Database Schema
```sql
-- Migration: add_collaboration_system.sql
CREATE TABLE IF NOT EXISTS collaboration_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    collaboration_type VARCHAR(50) NOT NULL, -- 'producer', 'vocalist', 'mixer', 'visual_artist', 'general'
    skills_needed TEXT[], -- Array of skills
    genres TEXT[], -- Array of genres
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collaboration_applications (
    id SERIAL PRIMARY KEY,
    collaboration_id INTEGER NOT NULL REFERENCES collaboration_requests(id) ON DELETE CASCADE,
    applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    portfolio_links TEXT[], -- Links to work samples
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collaboration_id, applicant_id)
);

-- Add skills to user profiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_role VARCHAR(100); -- 'Producer', 'MC', 'Designer', etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_for_collab BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_collab_requests_user ON collaboration_requests(user_id);
CREATE INDEX idx_collab_requests_status ON collaboration_requests(status);
CREATE INDEX idx_collab_requests_type ON collaboration_requests(collaboration_type);
CREATE INDEX idx_collab_applications_collab ON collaboration_applications(collaboration_id);
CREATE INDEX idx_collab_applications_applicant ON collaboration_applications(applicant_id);
```

### Backend Implementation

#### New Route: `server/routes/collaborations.js`
```javascript
// GET /api/collaborations - Get all open collaboration requests (filterable)
// GET /api/collaborations/:id - Get single collaboration request
// POST /api/collaborations - Create new collaboration request
// PUT /api/collaborations/:id - Update collaboration request
// DELETE /api/collaborations/:id - Delete collaboration request
// POST /api/collaborations/:id/apply - Apply to collaboration
// GET /api/collaborations/:id/applications - Get applications (owner only)
// PUT /api/collaborations/applications/:id/accept - Accept application
// PUT /api/collaborations/applications/:id/reject - Reject application
// GET /api/collaborations/mine - Get user's collaboration requests
// GET /api/collaborations/applied - Get collaborations user applied to
```

**Key Functions:**
- `searchCollaborations(filters)` - Filter by type, skills, genres
- `matchCollaborators(userId)` - Suggest relevant collaborations
- `notifyCollaborationUpdate(collabId, status)` - Notify via socket

### Frontend Implementation

#### New Page: `public/collaborate.html`
**Sections:**
- Browse collaboration requests (filterable)
- Create new collaboration request form
- My collaboration requests
- My applications
- Suggested collaborations (based on skills)

**Filters:**
- Collaboration type
- Skills needed
- Genre
- Status (open/closed)

#### Update: `public/profile.html`
**New Sections:**
- Artist role badge
- Skills tags
- "Available for Collaboration" toggle
- Link to collaboration requests

#### New File: `public/js/collaborate.js`
**Functions:**
- `loadCollaborationRequests(filters)`
- `createCollaborationRequest(data)`
- `applyToCollaboration(collabId, message)`
- `acceptApplication(appId)`
- `rejectApplication(appId)`
- `loadSuggestedCollabs()`

### Testing Checklist
- [ ] Users can create collaboration requests
- [ ] Users can apply to collaborations
- [ ] Applications visible to request owner
- [ ] Accept/reject applications work
- [ ] Filters work correctly
- [ ] Skills display on profiles
- [ ] Suggested collaborations relevant
- [ ] Notifications work for updates
- [ ] Status changes reflect correctly

---

## Feature 3.2: Artist Verification System

### Database Schema
```sql
-- Migration: add_verification_system.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_links TEXT[] NOT NULL, -- Links to external profiles/work
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

-- Verification criteria tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;
```

### Backend Implementation

#### New Route: `server/routes/verification.js`
```javascript
// POST /api/verification/request - Submit verification request
// GET /api/verification/status - Check verification status
// GET /api/verification/requests - Get all verification requests (admin only)
// PUT /api/verification/requests/:id/approve - Approve request (admin only)
// PUT /api/verification/requests/:id/reject - Reject request (admin only)
```

**Verification Criteria:**
- Minimum 10 posts
- Minimum 25 friends
- Account age > 30 days
- No moderation violations
- Active engagement (reactions, comments)
- External portfolio links required

**Key Functions:**
- `checkVerificationEligibility(userId)` - Check if user meets criteria
- `requestVerification(userId, portfolio, reason)` - Submit request
- `approveVerification(userId, adminId)` - Grant verification
- `rejectVerification(userId, adminId, reason)` - Deny request

### Frontend Implementation

#### Update: `public/profile.html`
**Features:**
- Verification badge display (✓ icon next to username)
- "Request Verification" button (if eligible)
- Verification criteria progress indicators
- Verification status display

#### New Modal: Verification Request Form
**Fields:**
- Portfolio links (SoundCloud, Bandcamp, etc.)
- Reason for verification
- Terms acceptance
- Show eligibility checklist

#### Update: `public/moderation.html`
**Admin Section:**
- Pending verification requests
- User portfolio review
- Approve/reject buttons
- Rejection reason input

#### Update: `public/css/style.css`
- Verification badge styling (glowing effect)
- Verification request form
- Progress indicators

### Testing Checklist
- [ ] Verification badge displays correctly
- [ ] Eligibility criteria calculated correctly
- [ ] Request form validates inputs
- [ ] Admins can approve/reject requests
- [ ] Users notified of approval/rejection
- [ ] Badge persists across site
- [ ] Verified users stand out visually
- [ ] Cannot request if ineligible

---

## Feature 3.3: Discovery Algorithm & "For You" Feed

### Database Schema
```sql
-- Migration: add_discovery_algorithm.sql
CREATE TABLE IF NOT EXISTS user_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'like', 'comment', 'share', 'save')),
    interaction_weight FLOAT DEFAULT 1.0, -- Different weights for different actions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_genres TEXT[],
    preferred_tags TEXT[],
    preferred_media_types TEXT[], -- 'audio', 'image', 'video'
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_post ON user_interactions(post_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_time ON user_interactions(created_at DESC);
```

### Backend Implementation

#### New Route: `server/routes/discovery.js`
```javascript
// GET /api/discovery/for-you - Get personalized feed
// GET /api/discovery/similar-artists/:userId - Get similar artists
// GET /api/discovery/recommended-posts - Get recommended posts
// GET /api/discovery/trending - Get trending posts (24h engagement)
// POST /api/discovery/track-interaction - Track user interaction
```

**Algorithm Components:**

1. **Interaction Scoring:**
   - View: 1 point
   - Like: 3 points
   - Comment: 5 points
   - Share: 7 points
   - Save: 10 points

2. **Recommendation Factors:**
   - Friends' posts (high weight)
   - Tags user frequently interacts with
   - Genres user listens to
   - Similar artists (collaborative filtering)
   - Trending content (engagement boost)
   - New artist boost (30 days)
   - Recency decay (older posts weighted less)

3. **Similarity Calculation:**
   - Common friends (Jaccard similarity)
   - Common tags/genres
   - Interaction overlap
   - Follower overlap (once following implemented)

**Key Functions:**
- `getPersonalizedFeed(userId, limit, offset)` - Main recommendation algorithm
- `trackInteraction(userId, postId, type)` - Record user actions
- `calculateUserPreferences(userId)` - Infer preferences from history
- `getSimilarArtists(userId, limit)` - Find similar users
- `getTrendingPosts(timeframe)` - Most engaged posts

### Frontend Implementation

#### Update: `public/index.html`
**Feed Tabs:**
- Following (friends' posts)
- For You (algorithmic feed)
- Trending (24h engagement)
- Latest (chronological, public)

#### New File: `public/js/discovery.js`
**Functions:**
- `loadForYouFeed()`
- `loadTrendingFeed()`
- `trackPostView(postId)` - Track impressions
- `loadSimilarArtists()`
- `refreshRecommendations()`

**Infinite Scroll:**
- Load more posts as user scrolls
- Track which posts are viewed
- Prefetch next batch

#### Update: `public/profile.html`
**Similar Artists Section:**
- "Artists similar to [username]"
- Grid of similar user profiles
- "See More" link

### Testing Checklist
- [ ] For You feed displays personalized content
- [ ] Trending feed shows high-engagement posts
- [ ] Interactions tracked correctly
- [ ] Similar artists algorithm works
- [ ] Feed refreshes with new content
- [ ] New artist boost applies
- [ ] Performance acceptable (<1s load time)
- [ ] No duplicate posts in feed
- [ ] Respects visibility settings

---

## Feature 3.4: Advanced Search

### Database Schema
```sql
-- Migration: add_search_functionality.sql
-- Add full-text search indexes
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_users_username_search ON users USING gin(to_tsvector('english', username));
CREATE INDEX IF NOT EXISTS idx_users_bio_search ON users USING gin(to_tsvector('english', bio));
```

### Backend Implementation

#### New Route: `server/routes/search.js`
```javascript
// GET /api/search?q=query&type=all - Universal search
// GET /api/search/posts?q=query&filters - Search posts
// GET /api/search/users?q=query - Search users
// GET /api/search/tags?q=query - Search tags
// GET /api/search/collaborations?q=query - Search collaborations
```

**Search Features:**
- Full-text search (PostgreSQL tsvector)
- Fuzzy matching for typos
- Filters: media type, genre, date range, verified only
- Sort: relevance, date, popularity

### Frontend Implementation

#### New File: `public/search.html`
**Search Interface:**
- Universal search bar (navbar)
- Results page with tabs (Posts, Users, Tags, Collaborations)
- Advanced filters sidebar
- Sort options
- "No results" suggestions

#### Update: `public/js/app.js`
- Global search bar in navbar
- Real-time search suggestions (debounced)
- Recent searches (localStorage)

### Testing Checklist
- [ ] Search finds relevant posts
- [ ] Search finds users by username/bio
- [ ] Tag search works
- [ ] Filters apply correctly
- [ ] Sort options work
- [ ] Pagination works
- [ ] Fast search results (<500ms)
- [ ] Handles special characters
- [ ] Empty results handled gracefully

---

## Phase 3 Deploy Point Checklist

### Pre-Deployment Tasks
- [ ] Collaboration system tested
- [ ] Verification flow tested
- [ ] Algorithm tested with sample data
- [ ] Search performance tested
- [ ] Database indexes optimized

### Deployment Steps
1. [ ] Run Phase 3 migrations
2. [ ] Deploy algorithm updates
3. [ ] Test collaboration features
4. [ ] Test verification system
5. [ ] Monitor algorithm performance
6. [ ] Gather user feedback on recommendations

### Success Metrics
- [ ] Collaboration requests created
- [ ] Verification requests submitted
- [ ] For You feed engagement higher than chronological
- [ ] Search queries fast
- [ ] User discovery improved

---

# PHASE 4: PROFESSIONAL TOOLS

## 🎯 Deploy Point 4 Goals
- Artists can share project files and sample packs
- Tutorial system for educational content
- Support/monetization options for artists
- Professional workflow features

---

## Feature 4.1: Project Files & Sample Pack Sharing

### Database Schema
```sql
-- Migration: add_file_sharing.sql
CREATE TABLE IF NOT EXISTS shared_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE, -- Optional: associate with post
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'daw_project', 'sample_pack', 'preset', 'other'
    file_format VARCHAR(20), -- '.flp', '.als', '.zip', etc.
    file_size BIGINT NOT NULL, -- in bytes
    file_url TEXT NOT NULL, -- S3/storage URL (move away from Base64)
    download_count INTEGER DEFAULT 0,
    license_type VARCHAR(50) DEFAULT 'all_rights_reserved', -- 'cc0', 'attribution', 'non_commercial', etc.
    description TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS file_downloads (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES shared_files(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_files_user ON shared_files(user_id);
CREATE INDEX idx_shared_files_type ON shared_files(file_type);
CREATE INDEX idx_shared_files_downloads ON shared_files(download_count DESC);
CREATE INDEX idx_file_downloads_file ON file_downloads(file_id);
```

### Backend Implementation

**Storage Migration:**
- Move from Base64 to file storage (AWS S3, Railway Volumes, or Cloudinary)
- Implement signed URLs for secure downloads
- File size limits: 500MB per file, 1GB per sample pack

#### New Route: `server/routes/files.js`
```javascript
// GET /api/files - Browse shared files (filterable)
// GET /api/files/:id - Get file details
// POST /api/files/upload - Upload file
// GET /api/files/:id/download - Download file (track download)
// DELETE /api/files/:id - Delete file (owner only)
// GET /api/files/user/:userId - Get user's shared files
// GET /api/files/popular - Most downloaded files
```

**Supported File Types:**
- **DAW Projects:** .flp (FL Studio), .als (Ableton), .logic (Logic Pro), .ptx (Pro Tools)
- **Sample Packs:** .zip (archives)
- **Presets:** .fxp, .adg, .nmsv, .xps
- **Other:** .pdf (sheets/docs), .mid (MIDI)

**Key Functions:**
- `uploadFile(userId, file, metadata)` - Upload to storage
- `generateSignedUrl(fileId, expiryMinutes)` - Secure download link
- `trackDownload(fileId, userId)` - Increment counter
- `deleteFile(fileId, userId)` - Remove from storage

### Frontend Implementation

#### New Page: `public/files.html`
**Browse Files:**
- File grid/list view
- Filter by type (DAW projects, samples, presets)
- Sort by downloads, date, popularity
- License filter
- Download button with counter

#### New Component: File Upload Modal
**Fields:**
- File selector (drag & drop)
- File type selector
- License selector (with explanations)
- Description
- Tags
- Associate with post (optional)

#### Update: `public/profile.html`
**Shared Files Section:**
- Grid of user's shared files
- Total downloads count
- Most downloaded file highlight

#### New File: `public/js/files.js`
**Functions:**
- `uploadFile(file, metadata)`
- `downloadFile(fileId)` - Track and download
- `loadSharedFiles(filters)`
- `parseFileMetadata(file)` - Extract file info

### Testing Checklist
- [ ] File upload works (large files)
- [ ] Download tracking works
- [ ] File storage secure (signed URLs)
- [ ] License information displays
- [ ] Filters work correctly
- [ ] File deletion works
- [ ] Associated posts show files
- [ ] Download limits enforced (if any)
- [ ] File formats validated
- [ ] Progress indicator for uploads/downloads

---

## Feature 4.2: Tutorial System

### Database Schema
```sql
-- Migration: add_tutorial_system.sql
CREATE TABLE IF NOT EXISTS tutorials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(50), -- 'mixing', 'mastering', 'sound_design', 'composition', etc.
    estimated_time INTEGER, -- in minutes
    content TEXT NOT NULL, -- Markdown or rich text
    thumbnail TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutorial_steps (
    id SERIAL PRIMARY KEY,
    tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT, -- Image or video for this step
    timestamp INTEGER, -- Video timestamp if applicable
    UNIQUE(tutorial_id, step_number)
);

CREATE TABLE IF NOT EXISTS tutorial_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tutorial_id)
);

CREATE TABLE IF NOT EXISTS tutorial_ratings (
    id SERIAL PRIMARY KEY,
    tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutorial_id, user_id)
);

CREATE INDEX idx_tutorials_user ON tutorials(user_id);
CREATE INDEX idx_tutorials_category ON tutorials(category);
CREATE INDEX idx_tutorials_difficulty ON tutorials(difficulty);
CREATE INDEX idx_tutorial_steps_tutorial ON tutorial_steps(tutorial_id);
```

### Backend Implementation

#### New Route: `server/routes/tutorials.js`
```javascript
// GET /api/tutorials - Get all tutorials (filterable)
// GET /api/tutorials/:id - Get single tutorial with steps
// POST /api/tutorials - Create tutorial
// PUT /api/tutorials/:id - Update tutorial
// DELETE /api/tutorials/:id - Delete tutorial
// POST /api/tutorials/:id/bookmark - Bookmark tutorial
// DELETE /api/tutorials/:id/bookmark - Remove bookmark
// POST /api/tutorials/:id/rate - Rate tutorial
// GET /api/tutorials/:id/ratings - Get ratings
// GET /api/tutorials/bookmarked - Get user's bookmarked tutorials
```

**Key Functions:**
- `createTutorial(userId, tutorialData, steps)` - Create with steps
- `trackTutorialView(tutorialId)` - Increment view count
- `getTutorialsByCategory(category)` - Filter tutorials
- `getPopularTutorials(limit)` - Most viewed/rated

### Frontend Implementation

#### New Page: `public/tutorials.html`
**Browse Tutorials:**
- Tutorial cards with thumbnails
- Filter by category, difficulty
- Sort by views, rating, date
- Search tutorials

#### New Page: `public/tutorial-detail.html`
**Tutorial View:**
- Step-by-step interface
- Progress tracker
- Video player (if video tutorial)
- Time-stamped sections
- Bookmark button
- Rating/review section
- Related tutorials

#### New Page: `public/tutorial-create.html`
**Tutorial Creator:**
- WYSIWYG editor (markdown support)
- Add multiple steps
- Upload step images/videos
- Set difficulty, category, time
- Preview before publishing

#### New File: `public/js/tutorials.js`
**Functions:**
- `loadTutorials(filters)`
- `viewTutorial(tutorialId)`
- `createTutorial(tutorialData)`
- `bookmarkTutorial(tutorialId)`
- `rateTutorial(tutorialId, rating, review)`
- `trackProgress(tutorialId, stepNumber)` - localStorage

### Testing Checklist
- [ ] Users can create tutorials
- [ ] Step-by-step display works
- [ ] Bookmarking works
- [ ] Ratings display correctly
- [ ] Video timestamps work
- [ ] Markdown renders correctly
- [ ] Progress saves locally
- [ ] Search finds relevant tutorials
- [ ] Filters work correctly
- [ ] Mobile view responsive

---

## Feature 4.3: Artist Support & Monetization

### Database Schema
```sql
-- Migration: add_artist_support.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS support_links JSONB; -- Ko-fi, PayPal, etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_status VARCHAR(20) CHECK (commission_status IN ('open', 'closed', 'limited'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_info TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rate_info VARCHAR(255); -- "Starting at $50"

CREATE TABLE IF NOT EXISTS commission_requests (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(100),
    deadline DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commission_requests_artist ON commission_requests(artist_id);
CREATE INDEX idx_commission_requests_client ON commission_requests(client_id);
CREATE INDEX idx_commission_requests_status ON commission_requests(status);
```

### Backend Implementation

#### Update: `server/routes/profiles.js`
```javascript
// Add to profile update:
// - support_enabled
// - support_links (ko-fi, paypal, venmo, etc.)
// - commission_status
// - commission_info
// - rate_info
```

#### New Route: `server/routes/commissions.js`
```javascript
// GET /api/commissions/artists - Get artists accepting commissions
// POST /api/commissions/request - Request commission from artist
// GET /api/commissions/received - Get commission requests (artist)
// GET /api/commissions/sent - Get commission requests (client)
// PUT /api/commissions/:id/accept - Accept commission
// PUT /api/commissions/:id/reject - Reject commission
// PUT /api/commissions/:id/complete - Mark as completed
```

### Frontend Implementation

#### Update: `public/profile.html`
**Support Section:**
- "Support Me" section with external links
- Ko-fi button
- PayPal button
- "Buy me a coffee" widget
- Commission status badge
- Commission info text
- Rate information
- "Request Commission" button

#### New Page: `public/commissions.html`
**Commission Hub:**
- Browse artists accepting commissions
- Filter by type, rate
- Artist commission portfolios
- Request form

#### Update: Profile Settings
**Monetization Tab:**
- Enable/disable support
- Add support links
- Set commission status
- Edit commission info
- Set rates

### Testing Checklist
- [ ] Support links display on profiles
- [ ] External links work correctly
- [ ] Commission status updates
- [ ] Request form submits
- [ ] Artists receive notifications
- [ ] Accept/reject works
- [ ] Status tracking functional
- [ ] Browse commission artists works

---

## Feature 4.4: Gear & Tools Tagging

### Database Schema
```sql
-- Migration: add_gear_tools_system.sql
CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'daw', 'plugin', 'hardware', 'software', 'instrument'
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_tools (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, tool_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS gear_list JSONB; -- User's equipment/software

CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_use_count ON tools(use_count DESC);
CREATE INDEX idx_post_tools_post ON post_tools(post_id);
CREATE INDEX idx_post_tools_tool ON post_tools(tool_id);
```

### Backend Implementation

#### New Route: `server/routes/tools.js`
```javascript
// GET /api/tools - Get all tools
// GET /api/tools/:id/posts - Get posts using specific tool
// POST /api/tools - Create tool (auto-created on post)
// GET /api/tools/popular - Most used tools
// GET /api/tools/search?q=query - Search tools
```

#### Update: `server/routes/posts.js`
```javascript
// Modify POST /api/posts to accept tools array
// Link tools to post in post_tools table
```

### Frontend Implementation

#### Update: Post Creation Form
**Tools Section:**
- Tool selector (autocomplete)
- Category filter (DAWs, Plugins, Hardware)
- Popular tools suggestions
- Add custom tool

#### Update: Post Display
**Tools Used Badge:**
- List of tools at bottom of post
- Clickable to see more posts with that tool
- Icon/logo for popular tools

#### Update: `public/profile.html`
**Gear List Section:**
- User's equipment/software
- Editable list
- Categories (DAW, Plugins, Hardware, etc.)
- "Made with" statistics

#### New Page: `public/tools.html`
**Browse by Tool:**
- Tool directory
- Filter by category
- Most popular tools
- See posts made with each tool

### Testing Checklist
- [ ] Tools autocomplete works
- [ ] Posts display tools used
- [ ] Tool clicks filter posts
- [ ] Popular tools display correctly
- [ ] Gear list editable on profile
- [ ] Custom tools can be added
- [ ] Tool categories filter correctly
- [ ] Stats display correctly

---

## Phase 4 Deploy Point Checklist

### Pre-Deployment Tasks
- [ ] File storage configured (S3/alternatives)
- [ ] File upload tested (large files)
- [ ] Tutorial system tested
- [ ] Support links tested
- [ ] Tools system tested
- [ ] Storage costs calculated

### Deployment Steps
1. [ ] Set up file storage service
2. [ ] Run Phase 4 migrations
3. [ ] Deploy file sharing features
4. [ ] Test file uploads/downloads
5. [ ] Test tutorial creation
6. [ ] Monitor storage usage

### Success Metrics
- [ ] Files uploaded and downloaded
- [ ] Tutorials created
- [ ] Support links clicked
- [ ] Commission requests sent
- [ ] Tools tagged on posts
- [ ] Storage costs manageable

---

# PHASE 5: ADVANCED SOCIAL

## 🎯 Deploy Point 5 Goals
- Crews/Groups for collectives and labels
- Live listening sessions and events
- Remix chains with attribution
- Advanced community structures

---

## Feature 5.1: Crews/Groups System

### Database Schema
```sql
-- Migration: add_crews_system.sql
CREATE TABLE IF NOT EXISTS crews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    crew_type VARCHAR(20) DEFAULT 'open' CHECK (crew_type IN ('open', 'invite_only', 'private')),
    avatar TEXT,
    banner TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crew_members (
    id SERIAL PRIMARY KEY,
    crew_id INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crew_id, user_id)
);

CREATE TABLE IF NOT EXISTS crew_invites (
    id SERIAL PRIMARY KEY,
    crew_id INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crew_id, invitee_id)
);

CREATE TABLE IF NOT EXISTS crew_posts (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    crew_id INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id)
);

CREATE TABLE IF NOT EXISTS crew_chatrooms (
    id SERIAL PRIMARY KEY,
    crew_id INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    chatroom_id INTEGER NOT NULL REFERENCES chatrooms(id) ON DELETE CASCADE,
    UNIQUE(crew_id)
);

CREATE INDEX idx_crews_owner ON crews(owner_id);
CREATE INDEX idx_crews_type ON crews(crew_type);
CREATE INDEX idx_crew_members_crew ON crew_members(crew_id);
CREATE INDEX idx_crew_members_user ON crew_members(user_id);
CREATE INDEX idx_crew_invites_crew ON crew_invites(crew_id);
CREATE INDEX idx_crew_invites_invitee ON crew_invites(invitee_id);
```

### Backend Implementation

#### New Route: `server/routes/crews.js`
```javascript
// GET /api/crews - Browse all crews (public/open)
// GET /api/crews/:id - Get crew details
// POST /api/crews - Create new crew
// PUT /api/crews/:id - Update crew (admin only)
// DELETE /api/crews/:id - Delete crew (owner only)
// GET /api/crews/:id/members - Get crew members
// POST /api/crews/:id/join - Join crew (open crews only)
// POST /api/crews/:id/invite - Invite user to crew
// POST /api/crews/:id/leave - Leave crew
// DELETE /api/crews/:id/members/:userId - Remove member (admin only)
// GET /api/crews/:id/posts - Get crew posts
// POST /api/crews/:id/posts - Post to crew
// GET /api/crews/my - Get user's crews
// POST /api/crews/invites/:id/accept - Accept invite
// POST /api/crews/invites/:id/reject - Reject invite
```

**Key Functions:**
- `createCrew(ownerId, name, description, type)` - Create with owner as first member
- `inviteToСrew(crewId, inviterId, inviteeId)` - Send invite
- `joinCrew(crewId, userId)` - Add member
- `getCrewFeed(crewId)` - Get crew-specific posts
- `checkCrewPermission(crewId, userId, action)` - Permission system

### Frontend Implementation

#### New Page: `public/crews.html`
**Browse Crews:**
- Crew cards with avatars
- Filter by type (open, invite-only)
- Search crews
- Create new crew button
- My crews section

#### New Page: `public/crew-detail.html`
**Crew Page:**
- Crew banner and avatar
- Description
- Member count and list
- Crew feed (posts tagged to crew)
- Private crew chatroom (for members)
- Join/Leave button
- Invite members button (admins)
- Admin controls

#### New Component: Crew Creation Modal
**Fields:**
- Crew name
- Description
- Type (open/invite-only/private)
- Avatar upload
- Banner upload

#### Update: `public/js/posts.js`
- Add "Post to Crew" option
- Crew selector when creating post
- Crew badge on crew posts

#### New File: `public/js/crews.js`
**Functions:**
- `loadCrews()`
- `createCrew(crewData)`
- `joinCrew(crewId)`
- `leaveCrew(crewId)`
- `inviteToCrew(crewId, userId)`
- `loadCrewFeed(crewId)`
- `loadCrewMembers(crewId)`

### Testing Checklist
- [ ] Users can create crews
- [ ] Users can join open crews
- [ ] Invite system works
- [ ] Crew feed displays correctly
- [ ] Crew chatroom functional
- [ ] Admin controls work
- [ ] Member list displays
- [ ] Leave crew works
- [ ] Remove member works (admin)
- [ ] Private crews hidden from non-members

---

## Feature 5.2: Live Listening Sessions & Events

### Database Schema
```sql
-- Migration: add_events_system.sql
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crew_id INTEGER REFERENCES crews(id) ON DELETE CASCADE, -- Optional: crew event
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(30) CHECK (event_type IN ('listening_party', 'beat_battle', 'live_stream', 'showcase', 'other')),
    scheduled_at TIMESTAMP NOT NULL,
    duration INTEGER, -- in minutes
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    max_participants INTEGER, -- Optional limit
    chatroom_id INTEGER REFERENCES chatrooms(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'interested' CHECK (status IN ('interested', 'attending', 'attended')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_playlist (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    playlist_order INTEGER DEFAULT 0,
    played BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS live_sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    current_track_id INTEGER REFERENCES posts(id),
    track_position INTEGER DEFAULT 0, -- playback position in seconds
    started_at TIMESTAMP,
    paused BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_events_host ON events(host_id);
CREATE INDEX idx_events_scheduled ON events(scheduled_at);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_playlist_event ON event_playlist(event_id);
```

### Backend Implementation

#### New Route: `server/routes/events.js`
```javascript
// GET /api/events - Get upcoming events
// GET /api/events/:id - Get event details
// POST /api/events - Create event
// PUT /api/events/:id - Update event
// DELETE /api/events/:id - Cancel event
// POST /api/events/:id/attend - RSVP to event
// DELETE /api/events/:id/attend - Cancel RSVP
// GET /api/events/:id/attendees - Get attendees
// POST /api/events/:id/playlist - Add track to event playlist
// PUT /api/events/:id/start - Start live session
// PUT /api/events/:id/end - End live session
// GET /api/events/:id/session - Get current session state (for sync)
```

**Key Functions:**
- `createEvent(hostId, eventData)` - Create event and chatroom
- `startLiveSession(eventId)` - Begin synchronized playback
- `syncPlayback(eventId, trackId, position)` - Keep all users in sync
- `nextTrack(eventId)` - Advance to next in playlist

#### New Socket Events: `server/socketHandlers/events.js`
```javascript
// Client -> Server
// - join_event: Join live event
// - leave_event: Leave event
// - sync_request: Request current playback state

// Server -> Client
// - event_started: Event went live
// - track_changed: New track playing
// - playback_sync: Sync playback position
// - participant_joined: User joined event
// - participant_left: User left event
```

### Frontend Implementation

#### New Page: `public/events.html`
**Events Calendar:**
- Upcoming events list
- Past events
- Create event button
- Filter by type
- RSVP status indicators

#### New Page: `public/event-detail.html`
**Event Page:**
- Event info (title, description, date/time)
- Host info
- Attendee list
- RSVP button
- Countdown timer
- Join event button (when live)

#### New Page: `public/event-live.html`
**Live Event Interface:**
- Synchronized audio player
- Current track display with waveform
- Playlist queue
- Live chat (event chatroom)
- Participant list
- Host controls (next track, pause/resume)

#### New File: `public/js/events.js`
**Functions:**
- `loadEvents(filter)`
- `createEvent(eventData)`
- `rsvpEvent(eventId)`
- `joinLiveEvent(eventId)`
- `syncPlayback(trackId, position)` - Sync with server
- `loadEventPlaylist(eventId)`

**Live Sync Logic:**
- Socket.io for real-time sync
- Buffer for network latency
- Auto-advance to next track
- Handle pause/resume globally

### Testing Checklist
- [ ] Users can create events
- [ ] RSVP system works
- [ ] Event calendar displays correctly
- [ ] Notifications for upcoming events
- [ ] Live event can be started
- [ ] Synchronized playback works
- [ ] All participants hear same track at same time
- [ ] Chat works during event
- [ ] Playlist advances automatically
- [ ] Host controls functional

---

## Feature 5.3: Remix Chains & Attribution

### Database Schema
```sql
-- Migration: add_remix_system.sql
CREATE TABLE IF NOT EXISTS remixes (
    id SERIAL PRIMARY KEY,
    original_post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    remix_post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    remixer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    remix_type VARCHAR(30) DEFAULT 'remix' CHECK (remix_type IN ('remix', 'bootleg', 'flip', 'cover', 'sample')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(remix_post_id)
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS remix_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS remix_count INTEGER DEFAULT 0;

CREATE INDEX idx_remixes_original ON remixes(original_post_id);
CREATE INDEX idx_remixes_remix ON remixes(remix_post_id);
CREATE INDEX idx_remixes_remixer ON remixes(remixer_id);
```

### Backend Implementation

#### Update: `server/routes/posts.js`
```javascript
// POST /api/posts/:id/remix - Mark post as remix of another
// GET /api/posts/:id/remixes - Get all remixes of a post
// GET /api/posts/:id/remix-chain - Get full remix chain (tree structure)
// PUT /api/posts/:id/remix-settings - Enable/disable remixing
```

**Key Functions:**
- `linkRemix(originalPostId, remixPostId, remixType)` - Create remix link
- `getRemixChain(postId)` - Recursive query for full tree
- `notifyOriginalArtist(originalPostId, remixerId)` - Notify of remix

**Remix Chain Structure:**
```javascript
{
  id: 1,
  original: true,
  post: { ... },
  remixes: [
    {
      id: 2,
      post: { ... },
      remix_type: 'remix',
      remixes: [
        { id: 3, post: { ... } } // Remix of remix
      ]
    }
  ]
}
```

### Frontend Implementation

#### Update: Post Detail View
**Remix Section:**
- "Remix This" button (if enabled)
- Attribution to original (if remix)
- Remix count and "View Remixes" link
- Remix chain visualization (tree diagram)

#### New Modal: Remix Upload
**Fields:**
- Upload remix audio
- Select remix type (remix, flip, bootleg, etc.)
- Add description explaining changes
- Attribution (auto-generated)

#### Update: `public/js/posts.js`
**Functions:**
- `markAsRemix(postId, originalPostId, type)`
- `loadRemixChain(postId)`
- `visualizeRemixTree(remixData)` - D3.js tree diagram
- `createRemix(audioFile, originalPostId, description)`

**Remix Features:**
- Clear attribution on remix posts
- Link back to original
- Remix badge/icon
- Browse remixes as threaded list
- Tree visualization for complex chains

### Testing Checklist
- [ ] Users can mark posts as remixes
- [ ] Attribution displays correctly
- [ ] Remix chains load correctly
- [ ] Tree visualization works
- [ ] Notifications sent to original artist
- [ ] Remix count updates
- [ ] Disable remixing works
- [ ] Remix types display correctly
- [ ] Multiple remix levels supported

---

## Feature 5.4: Advanced Notifications System

### Database Schema
```sql
-- Migration: add_notifications_system.sql
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'friend_request', 'comment', 'remix', 'event_starting', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- URL to relevant content
    read BOOLEAN DEFAULT FALSE,
    actor_id INTEGER REFERENCES users(id), -- Who triggered the notification
    reference_id INTEGER, -- ID of referenced content (post, comment, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT FALSE,
    friend_requests BOOLEAN DEFAULT TRUE,
    comments BOOLEAN DEFAULT TRUE,
    reactions BOOLEAN DEFAULT TRUE,
    remixes BOOLEAN DEFAULT TRUE,
    events BOOLEAN DEFAULT TRUE,
    crew_invites BOOLEAN DEFAULT TRUE,
    collaboration_requests BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### Backend Implementation

#### New Route: `server/routes/notifications.js`
```javascript
// GET /api/notifications - Get user's notifications
// PUT /api/notifications/:id/read - Mark as read
// PUT /api/notifications/read-all - Mark all as read
// DELETE /api/notifications/:id - Delete notification
// GET /api/notifications/unread-count - Get unread count
// GET /api/notifications/preferences - Get notification settings
// PUT /api/notifications/preferences - Update settings
```

**Notification Triggers:**
- Friend request received
- Friend request accepted
- Comment on user's post
- Reply to user's comment
- Reaction on user's post
- User's post remixed
- Mentioned in post/comment (@username)
- Event starting soon (30 min)
- Crew invite
- Collaboration application
- Commission request

#### New Socket Event:
```javascript
// Server -> Client
// - new_notification: Real-time notification
```

### Frontend Implementation

#### Update: Navbar
**Notification Bell:**
- Bell icon with unread count badge
- Dropdown with recent notifications
- "See All" link
- Mark as read on view

#### New Page: `public/notifications.html`
**All Notifications:**
- Chronological list
- Unread/read styling
- Filter by type
- Mark all as read button
- Clear old notifications

#### New Page: Settings Section
**Notification Preferences:**
- Toggle each notification type
- Email notifications (future)
- Push notifications (PWA)

#### New File: `public/js/notifications.js`
**Functions:**
- `loadNotifications()`
- `markAsRead(notificationId)`
- `markAllAsRead()`
- `updateUnreadCount()`
- `handleRealtimeNotification(notification)` - Socket handler

### Testing Checklist
- [ ] Notifications created on triggers
- [ ] Real-time notifications work
- [ ] Unread count updates
- [ ] Mark as read works
- [ ] Notification links navigate correctly
- [ ] Preferences save correctly
- [ ] Notification dropdown works
- [ ] Clear old notifications works
- [ ] No duplicate notifications

---

## Phase 5 Deploy Point Checklist

### Pre-Deployment Tasks
- [ ] Crews system tested
- [ ] Event sync tested with multiple clients
- [ ] Remix chains tested
- [ ] Notifications tested for all triggers
- [ ] Socket.io load tested

### Deployment Steps
1. [ ] Run Phase 5 migrations
2. [ ] Deploy crews features
3. [ ] Deploy events system
4. [ ] Test live sync with real users
5. [ ] Deploy remix chains
6. [ ] Deploy notifications
7. [ ] Monitor real-time performance

### Success Metrics
- [ ] Crews created and active
- [ ] Live events hosted
- [ ] Playback sync functional
- [ ] Remixes linked correctly
- [ ] Notifications delivered promptly
- [ ] Socket connections stable

---

# PHASE 6: POLISH & SCALE

## 🎯 Deploy Point 6 Goals
- Progressive Web App with offline support
- Mature algorithmic feed
- Performance optimizations
- Production-ready at scale

---

## Feature 6.1: Progressive Web App (PWA)

### Implementation

#### New File: `public/manifest.json`
```json
{
  "name": "1SocialChat",
  "short_name": "1Social",
  "description": "Underground artist social platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#00ffff",
  "icons": [
    {
      "src": "/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### New File: `public/service-worker.js`
**Features:**
- Cache static assets (CSS, JS, images)
- Cache API responses (offline viewing)
- Background sync for failed requests
- Push notifications support

#### Update: All HTML files
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#00ffff">
```

#### New File: `public/js/pwa.js`
**Functions:**
- `registerServiceWorker()` - Register SW
- `checkForUpdates()` - SW update notification
- `enablePushNotifications()` - Request permission
- `handleOffline()` - Offline UI

### Testing Checklist
- [ ] App installable on mobile
- [ ] App installable on desktop
- [ ] Offline mode works
- [ ] Static assets cached
- [ ] Background sync works
- [ ] Push notifications work (if enabled)
- [ ] Update prompt appears

---

## Feature 6.2: Performance Optimizations

### Database Optimizations
```sql
-- Migration: performance_optimizations.sql
-- Add more indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility_created ON posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_status_ids ON friendships(status, requester_id, receiver_id);

-- Materialized view for trending posts
CREATE MATERIALIZED VIEW trending_posts AS
SELECT
    p.id,
    p.user_id,
    p.content,
    p.created_at,
    COUNT(DISTINCT pr.id) as reaction_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT ps.id) as share_count,
    (COUNT(DISTINCT pr.id) * 1 + COUNT(DISTINCT c.id) * 3 + COUNT(DISTINCT ps.id) * 5) as engagement_score
FROM posts p
LEFT JOIN post_reactions pr ON p.id = pr.post_id AND pr.created_at > NOW() - INTERVAL '24 hours'
LEFT JOIN comments c ON p.id = c.post_id AND c.created_at > NOW() - INTERVAL '24 hours'
LEFT JOIN post_shares ps ON p.id = ps.post_id AND ps.created_at > NOW() - INTERVAL '24 hours'
WHERE p.deleted_by_mod = FALSE AND p.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.id
ORDER BY engagement_score DESC;

-- Refresh materialized view hourly (set up cron job)
CREATE INDEX ON trending_posts(engagement_score DESC);
```

### Backend Optimizations

#### Implement Caching
```javascript
// server/cache.js
// - Redis or in-memory cache
// - Cache trending posts (1 hour TTL)
// - Cache user profiles (5 min TTL)
// - Cache collections (10 min TTL)
// - Cache popular tools/tags (1 hour TTL)
```

#### Query Optimizations
- Implement pagination for all list endpoints
- Eager load related data (avoid N+1 queries)
- Use `SELECT` only needed columns
- Implement cursor-based pagination for infinite scroll

#### API Rate Limiting
```javascript
// server/middleware/rateLimit.js
// - 100 requests per minute per user
// - 10 uploads per hour per user
// - 50 friend requests per hour per user
```

### Frontend Optimizations

#### Lazy Loading
- Lazy load images (Intersection Observer)
- Lazy load audio players (load on scroll)
- Code splitting (load routes on demand)
- Defer non-critical JavaScript

#### Image Optimization
- Compress images before upload
- Generate thumbnails server-side
- Use WebP format where supported
- Lazy load images with blur-up placeholder

#### Audio Optimization
- Compress audio files
- Stream audio instead of loading fully
- Preload next track in playlist
- Use Web Audio API for better performance

### Testing Checklist
- [ ] Page load time < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Feed scrolls smoothly (60fps)
- [ ] No memory leaks
- [ ] Images load progressively
- [ ] Audio streams efficiently
- [ ] API response time < 200ms (avg)
- [ ] Database queries optimized

---

## Feature 6.3: Mobile Responsiveness & UX

### Mobile Optimizations

#### Update: `public/css/style.css`
**Mobile-First Design:**
- Responsive grid layouts
- Touch-friendly button sizes (44x44px min)
- Swipe gestures for galleries
- Bottom navigation for mobile
- Pull-to-refresh feed
- Optimized forms for mobile keyboards

#### Update: All JavaScript files
**Touch Events:**
- Swipe left/right for galleries
- Pull-down to refresh
- Long-press menus
- Double-tap to like

### Testing Checklist
- [ ] Responsive on all screen sizes
- [ ] Touch gestures work
- [ ] Mobile navigation intuitive
- [ ] Forms usable on mobile
- [ ] Audio player mobile-optimized
- [ ] Chat window mobile-friendly
- [ ] Gestures conflict-free

---

## Feature 6.4: Analytics & Monitoring

### Database Schema
```sql
-- Migration: add_analytics.sql
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'post_create', 'audio_play', etc.
    event_data JSONB,
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- Partition by month for performance
CREATE TABLE analytics_events_2025_01 PARTITION OF analytics_events
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Backend Implementation

#### New Route: `server/routes/analytics.js`
```javascript
// POST /api/analytics/track - Track event
// GET /api/analytics/dashboard - Admin dashboard stats
// GET /api/analytics/user-stats/:userId - User's stats
```

**Tracked Events:**
- Page views
- Post creations
- Audio plays (per track)
- Search queries
- Button clicks (features)
- Time on site
- Errors

#### Admin Dashboard Stats
- Daily/monthly active users
- Total posts/audio tracks
- Most popular content
- User growth rate
- Engagement metrics
- Error rates

### Testing Checklist
- [ ] Events tracked correctly
- [ ] Admin dashboard displays stats
- [ ] User stats accurate
- [ ] Performance not impacted by tracking
- [ ] Privacy-compliant

---

## Feature 6.5: Accessibility (A11y)

### Implementation

#### Update: All HTML files
**ARIA Labels:**
- Add `aria-label` to icons
- Add `role` attributes
- Add `alt` text to images
- Keyboard navigation support

#### Update: `public/css/style.css`
**Accessibility:**
- Focus indicators visible
- High contrast mode support
- Respect `prefers-reduced-motion`
- Color-blind friendly colors (not just color for info)

#### Add: Keyboard Shortcuts
- `Space` - Play/pause audio
- `J` - Previous post
- `K` - Next post
- `L` - Like current post
- `C` - Comment on current post
- `/` - Focus search
- `?` - Show keyboard shortcuts help

### Testing Checklist
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Alt text on images
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Reduced motion respected

---

## Feature 6.6: Advanced Moderation Tools

### Database Schema
```sql
-- Migration: advanced_moderation.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_warning_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS moderation_actions (
    id SERIAL PRIMARY KEY,
    moderator_id INTEGER NOT NULL REFERENCES users(id),
    target_user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(30) NOT NULL, -- 'warn', 'ban', 'unban', 'delete_post', etc.
    reason TEXT NOT NULL,
    content_id INTEGER, -- ID of affected content
    content_type VARCHAR(20), -- 'post', 'comment', 'message'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auto_mod_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(30) NOT NULL, -- 'keyword_filter', 'spam_detection', 'rate_limit'
    rule_data JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX idx_moderation_actions_target ON moderation_actions(target_user_id);
```

### Backend Implementation

#### Update: `server/routes/moderation.js`
```javascript
// POST /api/moderation/warn/:userId - Warn user
// GET /api/moderation/actions - Moderation log
// POST /api/moderation/automod/rules - Create auto-mod rule
// GET /api/moderation/automod/rules - Get auto-mod rules
```

**Auto-Moderation:**
- Keyword filtering (profanity, slurs)
- Spam detection (duplicate posts)
- Rate limiting (posting frequency)
- Link blacklisting

### Testing Checklist
- [ ] Warning system works
- [ ] Moderation log accurate
- [ ] Auto-mod catches spam
- [ ] Keyword filter works
- [ ] False positives minimal

---

## Feature 6.7: Internationalization (i18n)

### Implementation

#### New File: `public/locales/en.json`
```json
{
  "nav.home": "Home",
  "nav.profile": "Profile",
  "post.create": "Create Post",
  "post.visibility.public": "Public",
  "post.visibility.friends": "Friends",
  ...
}
```

#### New File: `public/js/i18n.js`
**Functions:**
- `loadLanguage(locale)` - Load translations
- `t(key)` - Translate key
- `detectUserLanguage()` - Browser language

**Supported Languages (Initial):**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)

### Testing Checklist
- [ ] Language switcher works
- [ ] All strings translated
- [ ] RTL languages supported (future)
- [ ] Date/time formats localized
- [ ] Number formats localized

---

## Phase 6 Deploy Point Checklist

### Pre-Deployment Tasks
- [ ] PWA tested on multiple devices
- [ ] Performance benchmarks met
- [ ] Mobile UX tested
- [ ] Analytics validated
- [ ] Accessibility audit passed
- [ ] Load testing completed
- [ ] Security audit completed

### Deployment Steps
1. [ ] Deploy PWA features
2. [ ] Enable service worker
3. [ ] Deploy performance optimizations
4. [ ] Enable caching layer
5. [ ] Deploy analytics
6. [ ] Monitor performance metrics
7. [ ] Collect user feedback

### Success Metrics
- [ ] PWA install rate > 20%
- [ ] Average page load < 2 seconds
- [ ] Mobile bounce rate < 40%
- [ ] Daily active users growing
- [ ] No critical errors
- [ ] Positive user feedback

### Production Readiness
- [ ] All features tested end-to-end
- [ ] Database optimized and indexed
- [ ] Caching layer functional
- [ ] Rate limiting in place
- [ ] Error logging configured
- [ ] Monitoring dashboards set up
- [ ] Backup strategy implemented
- [ ] Rollback plan documented
- [ ] User documentation complete
- [ ] Privacy policy & ToS created

---

# APPENDIX

## Migration Strategy

### Phase 1 Migration Order
1. `add_friends_system.sql`
2. `add_audio_support.sql`
3. `add_tags_system.sql`
4. `add_multi_media_posts.sql`

### Phase 2 Migration Order
1. `add_comments_system.sql`
2. `add_collections.sql`
3. `add_embeds.sql`
4. `add_post_interactions.sql`

### Phase 3 Migration Order
1. `add_collaboration_system.sql`
2. `add_verification_system.sql`
3. `add_discovery_algorithm.sql`
4. `add_search_functionality.sql`

### Phase 4 Migration Order
1. `add_file_sharing.sql`
2. `add_tutorial_system.sql`
3. `add_artist_support.sql`
4. `add_gear_tools_system.sql`

### Phase 5 Migration Order
1. `add_crews_system.sql`
2. `add_events_system.sql`
3. `add_remix_system.sql`
4. `add_notifications_system.sql`

### Phase 6 Migration Order
1. `performance_optimizations.sql`
2. `add_analytics.sql`
3. `advanced_moderation.sql`

## Technology Recommendations

### File Storage (Phase 4+)
**Options:**
1. **AWS S3** - Industry standard, scalable
2. **Railway Volumes** - Integrated with existing host
3. **Cloudinary** - Media-focused, built-in optimization
4. **Backblaze B2** - Cost-effective

**Recommendation:** Cloudinary for media handling

### Caching (Phase 6)
**Options:**
1. **Redis** - Industry standard, fast
2. **Railway Redis** - Integrated solution
3. **Node-cache** - In-memory (simpler)

**Recommendation:** Redis for production

### Real-time Infrastructure
**Current:** Socket.io (good choice)
**Scaling:** Socket.io with Redis adapter for multi-server

### Search (Phase 3)
**Current:** PostgreSQL full-text search (good start)
**Future:** Elasticsearch or Algolia for advanced search

## Development Workflow

### Branch Strategy
- `main` - Production
- `develop` - Development
- `feature/feature-name` - Feature branches
- `hotfix/issue-name` - Emergency fixes

### Testing Strategy
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright/Cypress)
- Load testing (k6 or Artillery)

### Code Quality
- ESLint for linting
- Prettier for formatting
- Husky for pre-commit hooks
- SonarQube for code analysis (optional)

## Rollback Procedures

### Database Rollback
```sql
-- Each migration should have a down migration
-- Example: rollback_add_friends_system.sql
DROP TABLE IF EXISTS friendships CASCADE;
ALTER TABLE posts DROP COLUMN IF EXISTS visibility;
```

### Feature Flags
Implement feature flags to enable/disable features without deployment:
```javascript
// server/config/features.js
module.exports = {
  friends: true,
  audio_posts: true,
  crews: false, // Disable if issues found
  live_events: false
};
```

## Monitoring & Alerts

### Key Metrics to Monitor
- API response times (p50, p95, p99)
- Error rates (by endpoint)
- Database query times
- Socket.io connection count
- Memory/CPU usage
- Disk space (especially with file uploads)

### Alerting Thresholds
- Error rate > 1%
- API response time > 1s (p95)
- Database CPU > 80%
- Disk usage > 85%
- Socket connections > 5000

## Security Checklist

### Before Each Deploy
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize inputs)
- [ ] CSRF protection (tokens)
- [ ] Rate limiting enabled
- [ ] File upload validation
- [ ] Authentication secure (session secrets rotated)
- [ ] HTTPS enforced
- [ ] Dependencies updated (npm audit)
- [ ] Secrets not in codebase (.env only)
- [ ] CORS configured correctly

## Cost Estimates

### Railway Hosting (Estimated)
- **Hobby Plan:** $5/month (start)
- **Pro Plan:** $20/month (scaling)
- **Database:** ~$5-20/month depending on size
- **Redis:** ~$5/month
- **File Storage (Cloudinary):** $0-89/month (based on usage)

### Total Estimated Costs
- **Phase 1-2:** ~$10-15/month
- **Phase 3-4:** ~$30-50/month (with file storage)
- **Phase 5-6:** ~$50-100/month (at scale)

## Timeline Summary

| Phase | Duration | Features | Complexity |
|-------|----------|----------|------------|
| Phase 1 | 3 weeks | Friends, Audio, Tags | Medium |
| Phase 2 | 3 weeks | Comments, Collections, Embeds | Medium |
| Phase 3 | 3 weeks | Collaboration, Discovery | High |
| Phase 4 | 3 weeks | Files, Tutorials, Support | High |
| Phase 5 | 3 weeks | Crews, Events, Remixes | Very High |
| Phase 6 | 3 weeks | PWA, Optimization, Polish | Medium |
| **Total** | **18 weeks** | **Full platform** | **~4.5 months** |

**Realistic Timeline:** 5-6 months with testing and bug fixes

---

# CONCLUSION

This implementation plan provides a comprehensive roadmap for transforming 1SocialChat into a full-featured underground artist social platform. Each phase builds upon the previous, with clear deploy points for testing and user feedback.

**Key Success Factors:**
1. **Incremental deployment** - Ship features early, iterate based on feedback
2. **User testing** - Involve underground artists at each phase
3. **Performance focus** - Maintain speed as features grow
4. **Community-driven** - Let users guide feature priorities
5. **Sustainable growth** - Balance features with maintainability

**Next Steps:**
1. Review and prioritize features with stakeholders
2. Set up development environment
3. Begin Phase 1 implementation
4. Establish feedback loops with users
5. Monitor metrics and adjust plan as needed

---

*Plan generated by Claude Code - 2025-10-17*
*Last updated: Phase 6 deployment specifications*