// Admin-only authentication middleware

const { query } = require('../db');

const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  try {
    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  requireAdmin
};
