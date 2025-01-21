const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No authentication token provided');
    }

    console.log('Token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    if (!decoded || (!decoded._id && !decoded.userId)) {
      throw new Error('Invalid token format');
    }

    const userId = decoded._id || decoded.userId;
    const user = await User.findOne({ _id: userId });
    console.log('Found user:', user ? 'yes' : 'no');

    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(401).json({
      success: false,
      message: error.message === 'jwt expired' ? 'Token expired' : (error.message || 'Please authenticate')
    });
  }
};

module.exports = auth; 