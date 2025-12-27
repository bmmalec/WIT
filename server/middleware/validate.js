const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Validation middleware
 * Checks express-validator results and throws AppError if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    throw AppError.validation('Validation failed', details);
  }

  next();
};

module.exports = { validate };
