const User = require('../models/user.model');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Create a new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'player' // Default to player if role not specified
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bananaCount: user.bananaCount,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, isBlocked } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    
    await user.save();
    
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bananaCount: user.bananaCount,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Block/Unblock user
exports.toggleBlockUser = async (req, res) => {
  try {
    const { isBlocked } = req.body;
    
    if (isBlocked === undefined) {
      return res.status(400).json({ message: 'isBlocked field is required' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isBlocked = isBlocked;
    await user.save();
    
    res.status(200).json({
      message: isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bananaCount: user.bananaCount,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user block status', error: error.message });
  }
};

// Increment banana count
exports.incrementBananaCount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.bananaCount += 1;
    await user.save();
    
    res.status(200).json({
      message: 'Banana count incremented',
      bananaCount: user.bananaCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error incrementing banana count', error: error.message });
  }
};

// Get active users
exports.getActiveUsers = async (req, res) => {
  try {
    const activeUsers = await User.find({ isActive: true }, '-password');
    res.status(200).json(activeUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active users', error: error.message });
  }
};

// Get user rankings
exports.getUserRankings = async (req, res) => {
  try {
    const rankings = await User.find({}, '-password')
      .sort({ bananaCount: -1 })
      .limit(100);
    
    res.status(200).json(rankings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rankings', error: error.message });
  }
};
