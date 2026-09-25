'use strict';
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Compare a plain-text password with a bcrypt hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { hashPassword, comparePassword };
