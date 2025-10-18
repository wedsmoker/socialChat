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

// Allow both authenticated users and guests
const allowGuest = (req, res, next) => {
  // If not authenticated, create a guest session
  if (!req.session.userId && !req.session.guestId) {
    req.session.isGuest = true;
    req.session.guestId = generateGuestId();
    req.session.guestName = `Guest_${req.session.guestId.substring(0, 8)}`;
  }
  next();
};

const allowGuestSocket = (socket, next) => {
  const session = socket.request.session;

  // If not authenticated and not a guest, create guest session
  if (!session.userId && !session.guestId) {
    session.isGuest = true;
    session.guestId = generateGuestId();
    session.guestName = `Guest_${session.guestId.substring(0, 8)}`;
    session.save();
  }
  next();
};

// Generate a unique guest ID
const generateGuestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
};

module.exports = {
  requireAuth,
  requireAuthSocket,
  allowGuest,
  allowGuestSocket,
  generateGuestId
};
