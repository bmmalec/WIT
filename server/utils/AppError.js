/**
 * Custom Application Error class
 * Extends Error with HTTP status code, error code, and operational flag
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} code - Application error code (e.g., 'VALIDATION_ERROR')
   * @param {Array|Object} details - Additional error details (e.g., validation errors)
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new AppError(message, 400, code, details);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message, code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  /**
   * Create a 422 Validation error
   */
  static validation(message, details) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  /**
   * Create a 429 Rate Limited error
   */
  static rateLimited(message = 'Too many requests') {
    return new AppError(message, 429, 'RATE_LIMITED');
  }

  /**
   * Create a 423 Account Locked error
   */
  static accountLocked(message = 'Account is locked') {
    return new AppError(message, 423, 'ACCOUNT_LOCKED');
  }
}

module.exports = AppError;
