const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all posts (feed)
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await query(
      `SELECT p.*, u.username, u.profile_picture as user_profile_picture,
       (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reaction_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.deleted_by_mod = FALSE AND u.is_banned = FALSE
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT p.*, u.username, u.profile_picture as user_profile_picture,
       (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reaction_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
router.post('/', requireAuth, async (req, res) => {
  const { content, media_type, media_data } = req.body;

  // Validation
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 5000) {
    return res.status(400).json({ error: 'Content exceeds 5000 characters' });
  }

  // Validate media size (10MB limit for Base64)
  if (media_data && media_data.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'Media exceeds 10MB limit' });
  }

  // Validate media type
  if (media_type && !['image', 'video'].includes(media_type)) {
    return res.status(400).json({ error: 'Invalid media type. Must be "image" or "video"' });
  }

  try {
    const result = await query(
      `INSERT INTO posts (user_id, content, media_type, media_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, content, media_type, media_data, created_at, updated_at`,
      [req.session.userId, content, media_type || null, media_data || null]
    );

    const post = result.rows[0];

    // Get user info for the response
    const userResult = await query(
      'SELECT username, profile_picture FROM users WHERE id = $1',
      [req.session.userId]
    );

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        ...post,
        username: userResult.rows[0].username,
        user_profile_picture: userResult.rows[0].profile_picture,
        reaction_count: 0
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit post
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content, media_type, media_data } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 5000) {
    return res.status(400).json({ error: 'Content exceeds 5000 characters' });
  }

  if (media_data && media_data.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'Media exceeds 10MB limit' });
  }

  try {
    // Check if post belongs to user
    const checkResult = await query(
      'SELECT user_id FROM posts WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (checkResult.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this post' });
    }

    // Update post
    const result = await query(
      `UPDATE posts
       SET content = $1, media_type = $2, media_data = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, user_id, content, media_type, media_data, created_at, updated_at`,
      [content, media_type || null, media_data || null, id]
    );

    res.json({
      message: 'Post updated successfully',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete post
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if post belongs to user
    const checkResult = await query(
      'SELECT user_id FROM posts WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (checkResult.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    // Delete post (reactions will cascade)
    await query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// React to post
router.post('/:id/react', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reaction_type } = req.body;

  if (!reaction_type) {
    return res.status(400).json({ error: 'Reaction type is required' });
  }

  const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
  if (!validReactions.includes(reaction_type)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  try {
    // Check if post exists
    const postCheck = await query('SELECT id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Insert or update reaction
    await query(
      `INSERT INTO post_reactions (post_id, user_id, reaction_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING`,
      [id, req.session.userId, reaction_type]
    );

    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    console.error('React to post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove reaction from post
router.delete('/:id/react/:reaction_type', requireAuth, async (req, res) => {
  const { id, reaction_type } = req.params;

  try {
    await query(
      'DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3',
      [id, req.session.userId, reaction_type]
    );

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
