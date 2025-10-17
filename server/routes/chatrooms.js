const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all chatrooms
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.username as creator_username
       FROM chatrooms c
       LEFT JOIN users u ON c.created_by = u.id
       ORDER BY c.is_global DESC, c.created_at DESC`
    );

    res.json({ chatrooms: result.rows });
  } catch (error) {
    console.error('Get chatrooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages from a chatroom
router.get('/:id/messages', async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 100;

  try {
    const result = await query(
      `SELECT cm.*, u.username, u.profile_picture
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.chatroom_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2`,
      [id, limit]
    );

    res.json({ messages: result.rows.reverse() }); // Reverse to show oldest first
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new chatroom
router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Chatroom name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'Chatroom name exceeds 100 characters' });
  }

  try {
    const result = await query(
      `INSERT INTO chatrooms (name, created_by, is_global)
       VALUES ($1, $2, false)
       RETURNING id, name, created_by, is_global, created_at`,
      [name, req.session.userId]
    );

    res.status(201).json({
      message: 'Chatroom created successfully',
      chatroom: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Chatroom with this name already exists' });
    }
    console.error('Create chatroom error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete chatroom (only creator can delete)
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if chatroom exists and user is creator
    const checkResult = await query(
      'SELECT created_by, is_global FROM chatrooms WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    const chatroom = checkResult.rows[0];

    if (chatroom.is_global) {
      return res.status(403).json({ error: 'Cannot delete global chatroom' });
    }

    if (chatroom.created_by !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this chatroom' });
    }

    // Delete chatroom (messages will cascade)
    await query('DELETE FROM chatrooms WHERE id = $1', [id]);

    res.json({ message: 'Chatroom deleted successfully' });
  } catch (error) {
    console.error('Delete chatroom error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete message (only message author can delete)
router.delete('/:chatroomId/messages/:messageId', requireAuth, async (req, res) => {
  const { chatroomId, messageId } = req.params;

  try {
    // Check if message exists and user is author
    const checkResult = await query(
      'SELECT user_id FROM chat_messages WHERE id = $1 AND chatroom_id = $2',
      [messageId, chatroomId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (checkResult.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    await query('DELETE FROM chat_messages WHERE id = $1', [messageId]);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
