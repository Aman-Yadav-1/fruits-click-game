const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user exists and is not blocked
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }
    
    // Add user info to request object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Requires admin privileges' });
  }
};

// Middleware to check if user is player
exports.isPlayer = (req, res, next) => {
  if (req.user && req.user.role === 'player') {
    next();
  } else {
    return res.status(403).json({ message: 'Requires player privileges' });
  }
};
