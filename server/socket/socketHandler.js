const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Store connected users
const connectedUsers = new Map();

exports.socketHandler = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // If we have a decoded token with an ID, we can proceed
      // This approach is more forgiving and allows the socket connection
      // even if the user isn't found in the database yet
      if (decoded && decoded.id) {
        try {
          // Try to find the user in the database
          const user = await User.findById(decoded.id);
          
          if (user) {
            // If user exists, check if they're blocked
            if (user.isBlocked) {
              return next(new Error('Authentication error: User is blocked'));
            }
            
            // Attach user data to socket
            socket.user = {
              id: user._id.toString(),
              username: user.username,
              role: user.role,
              bananaCount: user.bananaCount
            };
          } else {
            // If user doesn't exist in DB but token is valid, create minimal user object
            socket.user = {
              id: decoded.id,
              username: decoded.username || 'User',
              role: decoded.role || 'player',
              bananaCount: 0
            };
          }
          
          next();
        } catch (dbError) {
          console.error('Database error in socket auth:', dbError);
          // Still allow connection with decoded token data
          socket.user = {
            id: decoded.id,
            username: decoded.username || 'User',
            role: decoded.role || 'player',
            bananaCount: 0
          };
          next();
        }
      } else {
        return next(new Error('Authentication error: Invalid token payload'));
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username}`);
    
    // Add user to connected users map
    connectedUsers.set(socket.user.id, {
      socketId: socket.id,
      ...socket.user
    });
    
    // Update user active status in database
    await User.findByIdAndUpdate(socket.user.id, {
      isActive: true,
      lastActive: Date.now()
    });
    
    // Emit updated active users list to admins
    emitActiveUsers(io);
    
    // Emit updated rankings to all users
    emitRankings(io);
    
    // Handle banana click
    socket.on('banana-click', async () => {
      try {
        // Only players can click
        if (socket.user.role !== 'player') {
          return;
        }
        
        // Update banana count in database
        const user = await User.findByIdAndUpdate(
          socket.user.id,
          { $inc: { bananaCount: 1 } },
          { new: true }
        );
        
        // Update user in connected users map
        if (connectedUsers.has(socket.user.id)) {
          const userData = connectedUsers.get(socket.user.id);
          userData.bananaCount = user.bananaCount;
          connectedUsers.set(socket.user.id, userData);
        }
        
        // Emit updated banana count to the user
        socket.emit('banana-count-updated', {
          bananaCount: user.bananaCount
        });
        
        // Emit updated rankings to all users
        emitRankings(io);
        
        // Emit updated active users to admins
        emitActiveUsers(io);
      } catch (error) {
        console.error('Error handling banana click:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      // Remove user from connected users map
      connectedUsers.delete(socket.user.id);
      
      // Update user active status in database
      await User.findByIdAndUpdate(socket.user.id, {
        isActive: false,
        lastActive: Date.now()
      });
      
      // Emit updated active users list to admins
      emitActiveUsers(io);
    });
  });
};

// Helper function to emit active users to all admin sockets
async function emitActiveUsers(io) {
  try {
    // Get all active users from database
    const activeUsers = await User.find({ isActive: true }, '-password');
    
    // Emit to all admin sockets
    for (const [userId, userData] of connectedUsers.entries()) {
      if (userData.role === 'admin') {
        io.to(userData.socketId).emit('active-users', activeUsers);
      }
    }
  } catch (error) {
    console.error('Error emitting active users:', error);
  }
}

// Helper function to emit rankings to all sockets
async function emitRankings(io) {
  try {
    // Get top 100 users by banana count
    const rankings = await User.find({}, '-password')
      .sort({ bananaCount: -1 })
      .limit(100);
    
    // Emit to all sockets
    io.emit('rankings-updated', rankings);
  } catch (error) {
    console.error('Error emitting rankings:', error);
  }
}
