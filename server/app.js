const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: ['https://fruit-click-game.vercel.app', process.env.CLIENT_URL || 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: ['https://fruit-click-game.vercel.app', process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add headers for handling CORS preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://fruit-click-game.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Fruits Click Game API Server', 
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Running in fallback mode without database');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'player'], default: 'player' },
  bananaCount: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// User Model
const User = mongoose.model('User', userSchema);

// Create default admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const admin = new User({
        username: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Create default player if not exists
const createDefaultPlayer = async () => {
  try {
    const playerExists = await User.findOne({ email: 'player@example.com' });
    if (!playerExists) {
      const player = new User({
        username: 'Player',
        email: 'player@example.com',
        password: 'player123',
        role: 'player',
        bananaCount: 50
      });
      await player.save();
      console.log('Default player user created');
    }
  } catch (error) {
    console.error('Error creating default player:', error);
  }
};

// Create default users after MongoDB connection
mongoose.connection.once('open', () => {
  createDefaultAdmin();
  createDefaultPlayer();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    // Handle admin tokens (demo mode)
    if (token.startsWith('admin-token-') || token.startsWith('mock-token-')) {
      socket.user = { id: 'demo-user', role: 'player' };
      return next();
    }
    
    // Verify JWT token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = verified;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle banana click
  socket.on('banana-click', async (data) => {
    const { amount } = data;
    
    try {
      // If we're in demo mode, just echo back the update
      if (socket.user.id === 'demo-user') {
        socket.emit('banana-count-updated', {
          bananaCount: data.currentCount + amount
        });
        return;
      }
      
      // Update user's banana count in database
      const user = await User.findById(socket.user.id);
      if (!user) return;
      
      user.bananaCount += amount;
      await user.save();
      
      // Emit updated count back to user
      socket.emit('banana-count-updated', {
        bananaCount: user.bananaCount
      });
    } catch (error) {
      console.error('Error updating banana count:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Auth routes
// Register route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password
    });
    
    const savedUser = await user.save();
    
    // Create and assign token
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        bananaCount: savedUser.bananaCount,
        isBlocked: savedUser.isBlocked
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      console.log('User is blocked:', email);
      return res.status(403).json({ message: 'Your account has been blocked' });
    }
    
    // Check password
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      console.log('Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    console.log('Login successful for:', email);
    
    // Create and assign token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Update user's active status
    user.isActive = true;
    await user.save();
    
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bananaCount: user.bananaCount,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Update user's active status
    if (req.user.id !== 'demo-user') {
      const user = await User.findById(req.user.id);
      if (user) {
        user.isActive = false;
        await user.save();
      }
    }
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user data
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    // Handle demo user
    if (req.user.id === 'demo-user') {
      return res.status(200).json({
        _id: 'demo-user',
        username: 'Demo User',
        email: 'demo@example.com',
        role: 'player',
        bananaCount: 50,
        isBlocked: false,
        isActive: true
      });
    }
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (admin only)
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { username, email, password, role, isBlocked } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'player',
      isBlocked: isBlocked || false
    });
    
    const savedUser = await user.save();
    
    res.status(201).json({
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      bananaCount: savedUser.bananaCount,
      isBlocked: savedUser.isBlocked
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { username, email, role, isBlocked } = req.body;
    
    // Find and update user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      bananaCount: updatedUser.bananaCount,
      isBlocked: updatedUser.isBlocked
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find and delete user
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { app, server };
