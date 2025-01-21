const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      username,
      password,
      isAdmin: false
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login request body:', req.body);
    console.log('Login attempt for username:', username || 'undefined');

    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ username });
    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch ? 'yes' : 'no');

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const tokenPayload = { _id: user._id.toString() };
    console.log('Creating token with payload:', tokenPayload);
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Token created:', token);

    // Send response without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin
    };

    console.log('Sending response:', {
      success: true,
      user: userResponse,
      tokenPreview: token.substring(0, 20) + '...'
    });

    res.json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        isAdmin: req.user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user data'
    });
  }
});

module.exports = router; 