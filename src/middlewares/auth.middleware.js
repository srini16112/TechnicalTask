'use strict';
const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');

/**
 * Middleware: verify Bearer access token.
 * Attaches req.user = { id, email, role } on success.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access token missing or malformed', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired', 401);
    }
    return sendError(res, 'Invalid access token', 401);
  }
};

/**
 * Middleware: require admin role.
 * Must be used AFTER verifyToken.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendError(res, 'Forbidden: admin access required', 403);
  }
  next();
};

module.exports = { verifyToken, requireAdmin };
