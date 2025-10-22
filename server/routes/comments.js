const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Will be set by index.js
let io = null;
router.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await query(
      `SELECT c.*, u.username, u.profile_picture,
       (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = c.id) as reaction_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a comment
router.post('/', requireAuth, async (req, res) => {
  const { post_id, content, parent_comment_id } = req.body;

  if (!post_id || !content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post ID and content are required' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: 'Comment exceeds 2000 characters' });
  }

  try {
    // Check if post exists
    const postCheck = await query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If replying to a comment, check if it exists
    if (parent_comment_id) {
      const parentCheck = await query(
        'SELECT id FROM comments WHERE id = $1 AND post_id = $2',
        [parent_comment_id, post_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }

    const result = await query(
      `INSERT INTO comments (post_id, user_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, post_id, user_id, parent_comment_id, content, created_at`,
      [post_id, req.session.userId, parent_comment_id || null, content.trim()]
    );

    // Get user info
    const userResult = await query(
      'SELECT username, profile_picture FROM users WHERE id = $1',
      [req.session.userId]
    );

    const commentData = {
      ...result.rows[0],
      username: userResult.rows[0].username,
      profile_picture: userResult.rows[0].profile_picture,
      reaction_count: 0
    };

    // Broadcast new comment to all connected clients
    if (io) {
      io.emit('new_comment', commentData);
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment: commentData
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a comment
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: 'Comment exceeds 2000 characters' });
  }

  try {
    // Check if comment belongs to user
    const checkResult = await query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (checkResult.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this comment' });
    }

    const result = await query(
      `UPDATE comments
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, post_id, user_id, parent_comment_id, content, created_at, updated_at`,
      [content.trim(), id]
    );

    res.json({
      message: 'Comment updated successfully',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if comment belongs to user
    const checkResult = await query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (checkResult.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Soft delete
    await query(
      'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// React to a comment
router.post('/:id/react', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reaction_type } = req.body;

  const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
  if (!validReactions.includes(reaction_type)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  try {
    // Check if comment exists
    const commentCheck = await query('SELECT id FROM comments WHERE id = $1', [id]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Insert or update reaction
    await query(
      `INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (comment_id, user_id, reaction_type) DO NOTHING`,
      [id, req.session.userId, reaction_type]
    );

    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    console.error('React to comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove reaction from comment
router.delete('/:id/react/:reaction_type', requireAuth, async (req, res) => {
  const { id, reaction_type } = req.params;

  try {
    await query(
      'DELETE FROM comment_reactions WHERE comment_id = $1 AND user_id = $2 AND reaction_type = $3',
      [id, req.session.userId, reaction_type]
    );

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
