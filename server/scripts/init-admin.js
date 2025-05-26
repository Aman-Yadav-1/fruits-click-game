require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('../models/user.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fruits-click-game', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    }
    
    // Create a test player if it doesn't exist
    const playerExists = await User.findOne({ username: 'player' });
    
    if (playerExists) {
      console.log('Test player already exists');
    } else {
      // Create test player
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('player123', salt);
      
      const player = new User({
        username: 'player',
        email: 'player@example.com',
        password: hashedPassword,
        role: 'player'
      });
      
      await player.save();
      console.log('Test player created successfully');
    }
    
    console.log('Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
