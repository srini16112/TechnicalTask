'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a short-lived access token (15m).
 * @param {{ id: string, email: string, role: string }} payload
 */
const generateAccessToken = (payload) =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });

/**
 * Generate a long-lived refresh token (7d).
 * @param {{ id: string, email: string, role: string }} payload
 */
const generateRefreshToken = (payload) =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });

/**
 * Verify an access token. Throws JsonWebTokenError on failure.
 * @param {string} token
 * @returns {{ id: string, email: string, role: string, iat: number, exp: number }}
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.accessSecret);

/**
 * Verify a refresh token. Throws JsonWebTokenError on failure.
 * @param {string} token
 * @returns {{ id: string, email: string, role: string, iat: number, exp: number }}
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwt.refreshSecret);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
