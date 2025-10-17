// Authentication middleware

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
};

const requireAuthSocket = (socket, next) => {
  if (!socket.request.session.userId) {
    return next(new Error('Unauthorized'));
  }
  next();
};

module.exports = {
  requireAuth,
  requireAuthSocket
};
