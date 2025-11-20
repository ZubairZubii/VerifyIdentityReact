const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

// JWT Secret (should match the one in auth_controller.js)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user account is active
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended'
      });
    }

    // Add user info to request
    req.userId = user._id;
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

// Middleware to check if user account is active
const requireActiveAccount = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account must be active to access this resource',
        userStatus: req.user.status
      });
    }

    next();
  } catch (error) {
    console.error('Active account check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.userId = user._id;
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireActiveAccount,
  optionalAuth
};


