const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('./errorHandler');

/**
 * Protect routes - require authentication
 * Verifies JWT from cookie and attaches user to request
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Also check Authorization header for API clients
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw AppError.unauthorized('Not authorized, no token');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw AppError.accountLocked('Account is locked');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw AppError.unauthorized('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Token expired');
    }
    throw error;
  }
});

/**
 * Optional authentication
 * Attaches user to request if token exists, but doesn't require it
 */
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Also check Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user && !user.isLocked()) {
      req.user = user;
    }
  } catch (error) {
    // Ignore token errors in optional auth
  }

  next();
});
