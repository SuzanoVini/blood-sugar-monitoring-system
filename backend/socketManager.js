// backend/socketManager.js
// Purpose: Manages WebSocket connections for real-time notifications using Socket.IO.

const socketIo = require('socket.io');

let io; // Stores the Socket.IO server instance
const connectedUsers = new Map(); // Maps userId -> socketId for direct messaging

/**
 * Initializes the Socket.IO server.
 * @param {Object} httpServer - The HTTP server instance (from Express app).
 */
function init(httpServer) {
  io = socketIo(httpServer, {
    cors: {
      origin: "http://localhost:3000", // Allow connections from the frontend
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Expect a 'register' event from the client with their userId
    socket.on('register', (userId) => {
      console.log(`User ${userId} registered with socket ${socket.id}`);
      connectedUsers.set(userId, socket.id); // Map user ID to their socket ID
      io.to(socket.id).emit('notification', { type: 'system', message: 'Connected to real-time updates.' });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Remove the user from the map when they disconnect
      for (let [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} unregistered.`);
          break;
        }
      }
    });

    // Handle any potential errors on the socket
    socket.on('error', (err) => {
      console.error(`Socket error for ${socket.id}:`, err);
    });
  });

  console.log('Socket.IO server initialized.');
}

/**
 * Sends a real-time notification to a specific user.
 * @param {number} userId - The ID of the user to send the notification to.
 * @param {Object} notificationData - The data of the notification (e.g., { type: 'alert', message: '...' }).
 * @returns {boolean} True if the user was found and notification was sent, false otherwise.
 */
function sendNotificationToUser(userId, notificationData) {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', notificationData);
    console.log(`Notification sent to user ${userId} (socket ${socketId}):`, notificationData);
    return true;
  } else {
    console.log(`User ${userId} is not connected for real-time notification.`);
    return false;
  }
}

/**
 * Sends a real-time notification to all connected specialists.
 * @param {Object} notificationData - The data of the notification.
 */
function sendNotificationToAllSpecialists(notificationData) {
  // This would require a more sophisticated tracking of roles on connection
  // For now, we can iterate through connected users and check their roles if roles were tracked.
  // As roles are not tracked in connectedUsers map, this function is a placeholder.
  console.log('Placeholder: Sending notification to all specialists (not yet implemented).');
  // Example: if connectedUsers tracked roles:
  // for (let [userId, socketId] of connectedUsers.entries()) {
  //   if (getUserRole(userId) === 'Specialist') { // getUserRole would be a DB lookup or tracked in map
  //     io.to(socketId).emit('notification', notificationData);
  //   }
  // }
}

module.exports = {
  init,
  sendNotificationToUser,
  sendNotificationToAllSpecialists
};
