const AppError = require('../utils/AppError');

/**
 * Global error handler middleware
 * Formats errors into consistent API response format
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
    });
  }

  // Handle specific error types

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    details = [{ field, message: `This ${field} is already in use` }];
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  }

  // Don't leak error details in production for non-operational errors
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    code = 'INTERNAL_ERROR';
    message = 'An unexpected error occurred';
    details = null;

    // Log the actual error for debugging
    console.error('Unexpected Error:', err);
  }

  // Send error response
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  // Include details if present
  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 Not Found for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
