'use strict';
const profileService = require('./profile.service');
const { sendSuccess } = require('../../utils/response.utils');

const getProfile = async (req, res) => sendSuccess(res, { profile: await profileService.getProfile(req.user.id) }, 'Profile fetched successfully');
const updateProfile = async (req, res) => sendSuccess(res, { profile: await profileService.updateProfile(req.user.id, req.body) }, 'Profile updated successfully');

module.exports = { getProfile, updateProfile };
