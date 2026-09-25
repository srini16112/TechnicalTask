'use strict';
const { sendError } = require('../utils/response.utils');

/**
 * Global Express error handler.
 * Must be registered LAST with 4 parameters.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  // Joi validation errors
  if (err.isJoi || err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 400, err.details || err.message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired token', 401);
  }

  // PostgreSQL unique violation (email duplicate)
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'field';
    return sendError(res, `${field} already exists`, 409);
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return sendError(res, 'Referenced resource not found', 404);
  }

  // Custom app errors with status
  if (err.status) {
    return sendError(res, err.message, err.status);
  }

  // Default 500
  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500
  );
};

module.exports = errorMiddleware;
