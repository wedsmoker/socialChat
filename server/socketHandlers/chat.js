const { query } = require('../db');

// Helper function to broadcast user count for a chatroom
const broadcastUserCount = (io, chatroomId) => {
  const room = io.sockets.adapter.rooms.get(`chatroom_${chatroomId}`);
  const userCount = room ? room.size : 0;
  io.to(`chatroom_${chatroomId}`).emit('user_count_update', { userCount });
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Check if user is authenticated
    const userId = socket.request.session.userId;
    const username = socket.request.session.username;

    if (!userId) {
      console.log('Unauthenticated socket connection');
      socket.disconnect();
      return;
    }

    console.log(`Authenticated user connected: ${username}`);

    // Track current chatroom
    let currentChatroomId = null;

    // Join a chatroom
    socket.on('join_chatroom', async (chatroomId) => {
      currentChatroomId = chatroomId;
      try {
        // Verify chatroom exists
        const result = await query(
          'SELECT id, name FROM chatrooms WHERE id = $1',
          [chatroomId]
        );

        if (result.rows.length === 0) {
          socket.emit('error', { message: 'Chatroom not found' });
          return;
        }

        const chatroom = result.rows[0];
        socket.join(`chatroom_${chatroomId}`);
        console.log(`${username} joined chatroom: ${chatroom.name}`);

        socket.emit('joined_chatroom', {
          chatroomId,
          chatroomName: chatroom.name
        });

        // Broadcast updated user count
        broadcastUserCount(io, chatroomId);
      } catch (error) {
        console.error('Join chatroom error:', error);
        socket.emit('error', { message: 'Failed to join chatroom' });
      }
    });

    // Leave a chatroom
    socket.on('leave_chatroom', (chatroomId) => {
      socket.leave(`chatroom_${chatroomId}`);
      console.log(`${username} left chatroom ${chatroomId}`);

      // Broadcast updated user count
      broadcastUserCount(io, chatroomId);
    });

    // Send message to chatroom
    socket.on('send_message', async (data) => {
      const { chatroomId, message } = data;

      if (!message || message.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (message.length > 2000) {
        socket.emit('error', { message: 'Message exceeds 2000 characters' });
        return;
      }

      try {
        // Insert message into database
        const result = await query(
          `INSERT INTO chat_messages (user_id, chatroom_id, message)
           VALUES ($1, $2, $3)
           RETURNING id, user_id, chatroom_id, message, created_at`,
          [userId, chatroomId, message]
        );

        const newMessage = result.rows[0];

        // Get user info
        const userResult = await query(
          'SELECT username, profile_picture FROM users WHERE id = $1',
          [userId]
        );

        const messageData = {
          ...newMessage,
          username: userResult.rows[0].username,
          profile_picture: userResult.rows[0].profile_picture
        };

        // Broadcast message to all users in the chatroom
        io.to(`chatroom_${chatroomId}`).emit('new_message', messageData);

        console.log(`Message sent by ${username} in chatroom ${chatroomId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { chatroomId } = data;
      socket.to(`chatroom_${chatroomId}`).emit('user_typing', {
        username,
        userId
      });
    });

    socket.on('stop_typing', (data) => {
      const { chatroomId } = data;
      socket.to(`chatroom_${chatroomId}`).emit('user_stop_typing', {
        username,
        userId
      });
    });

    // Handle message deletion via socket
    socket.on('delete_message', async (data) => {
      const { messageId, chatroomId } = data;

      try {
        // Check if message exists and user is author
        const checkResult = await query(
          'SELECT user_id FROM chat_messages WHERE id = $1 AND chatroom_id = $2',
          [messageId, chatroomId]
        );

        if (checkResult.rows.length === 0) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (checkResult.rows[0].user_id !== userId) {
          socket.emit('error', { message: 'Unauthorized to delete this message' });
          return;
        }

        await query('DELETE FROM chat_messages WHERE id = $1', [messageId]);

        // Notify all users in chatroom
        io.to(`chatroom_${chatroomId}`).emit('message_deleted', {
          messageId,
          chatroomId
        });

        console.log(`Message ${messageId} deleted by ${username}`);
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', username);

      // Broadcast updated user count for the chatroom they were in
      if (currentChatroomId) {
        broadcastUserCount(io, currentChatroomId);
      }
    });
  });
};
