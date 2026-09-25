'use strict';
const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

const register = async (req, res) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, result, 'Registration successful', 201);
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, result, 'Login successful');
};

const googleLogin = async (req, res) => {
  const result = await authService.googleLogin(req.body.idToken || req.body.credential);
  return sendSuccess(res, result, 'Google login successful');
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshTokens(refreshToken);
  return sendSuccess(res, tokens, 'Tokens refreshed successfully');
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return sendError(res, 'Refresh token required', 400);
  await authService.logout(refreshToken);
  return sendSuccess(res, null, 'Logged out successfully');
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, { user }, 'Profile fetched successfully');
};

module.exports = { register, login, googleLogin, refreshToken, logout, getMe };
