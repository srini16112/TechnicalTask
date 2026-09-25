'use strict';
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/password.utils');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt.utils');
const env = require('../../config/env');

const googleClient = new OAuth2Client(env.google.clientId);

// ─── Helpers ────────────────────────────────────────────────────────────────

const safeUser = (row) => ({
  id:        row.id,
  fullName:  row.full_name,
  email:     row.email,
  phone:     row.phone,
  role:      row.role,
  avatarUrl: row.avatar_url,
  isActive:  row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const createTokenPair = (user) => ({
  accessToken:  generateAccessToken({ id: user.id, email: user.email, role: user.role }),
  refreshToken: generateRefreshToken({ id: user.id, email: user.email, role: user.role }),
});

const storeRefreshToken = async (userId, refreshToken) => {
  // Parse expiry from JWT payload
  const [, payload] = refreshToken.split('.');
  const { exp } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  const expiresAt = new Date(exp * 1000);

  await query(
    `INSERT INTO tokens (id, user_id, token, token_type, expires_at)
     VALUES ($1, $2, $3, 'refresh', $4)`,
    [uuidv4(), userId, refreshToken, expiresAt]
  );
};

// ─── Service Methods ─────────────────────────────────────────────────────────

const register = async ({ fullName, email, phone, password }) => {
  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    const err = new Error('Email already registered'); err.status = 409; throw err;
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await query(
    `INSERT INTO users (full_name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [fullName, email, phone, passwordHash]
  );

  const user = rows[0];
  const tokens = createTokenPair(user);
  await storeRefreshToken(user.id, tokens.refreshToken);

  return { user: safeUser(user), ...tokens };
};

const login = async ({ email, password }) => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  const user = rows[0];

  if (!user.is_active) {
    const err = new Error('Account is deactivated. Please contact support.'); err.status = 403; throw err;
  }

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  const tokens = createTokenPair(user);
  await storeRefreshToken(user.id, tokens.refreshToken);

  return { user: safeUser(user), ...tokens };
};

const googleLogin = async (idToken) => {
  if (!env.google.clientId) {
    const err = new Error('Google login is not configured on the server'); err.status = 503; throw err;
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch (verificationError) {
    if (env.nodeEnv !== 'production') {
      console.error('[Google] ID token verification failed:', verificationError.message);
    }
    const message = env.nodeEnv === 'production'
      ? 'Invalid Google ID token'
      : `Invalid Google ID token: ${verificationError.message}`;
    const err = new Error(message); err.status = 401; throw err;
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    const err = new Error('Google account email is not verified'); err.status = 401; throw err;
  }

  const email = payload.email.toLowerCase();
  let result = await query('SELECT * FROM users WHERE google_subject = $1', [payload.sub]);
  let user = result.rows[0];

  if (!user) {
    result = await query('SELECT * FROM users WHERE email = $1', [email]);
    user = result.rows[0];

    if (user) {
      if (user.google_subject && user.google_subject !== payload.sub) {
        const err = new Error('This email is linked to another Google account'); err.status = 409; throw err;
      }
      const updated = await query(
        'UPDATE users SET google_subject = $1 WHERE id = $2 RETURNING *',
        [payload.sub, user.id]
      );
      user = updated.rows[0];
    } else {
      const passwordHash = await hashPassword(uuidv4());
      const created = await query(
        `INSERT INTO users (full_name, email, password_hash, google_subject)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [payload.name || email.split('@')[0], email, passwordHash, payload.sub]
      );
      user = created.rows[0];
    }
  }

  if (!user.is_active) {
    const err = new Error('Account is deactivated. Please contact support.'); err.status = 403; throw err;
  }

  const tokens = createTokenPair(user);
  await storeRefreshToken(user.id, tokens.refreshToken);
  return { user: safeUser(user), ...tokens };
};

const refreshTokens = async (refreshToken) => {
  // 1. Verify JWT signature / expiry
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token'); err.status = 401; throw err;
  }

  // 2. Check token exists in DB
  const { rows } = await query(
    `SELECT rt.*, u.email, u.role, u.is_active
     FROM tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token = $1 AND rt.token_type = 'refresh' AND rt.expires_at > NOW()`,
    [refreshToken]
  );

  if (rows.length === 0) {
    const err = new Error('Refresh token not found or expired'); err.status = 401; throw err;
  }

  const { user_id: userId, email, role } = rows[0];

  // 3. Rotate: delete old, issue new pair
  await query('DELETE FROM tokens WHERE token = $1', [refreshToken]);

  const newTokens = {
    accessToken:  generateAccessToken({ id: userId, email, role }),
    refreshToken: generateRefreshToken({ id: userId, email, role }),
  };
  await storeRefreshToken(userId, newTokens.refreshToken);

  return newTokens;
};

const logout = async (refreshToken) => {
  await query('DELETE FROM tokens WHERE token = $1', [refreshToken]);
};

const getMe = async (userId) => {
  const { rows } = await query(
    `SELECT id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  return safeUser(rows[0]);
};

module.exports = { register, login, googleLogin, refreshTokens, logout, getMe };
