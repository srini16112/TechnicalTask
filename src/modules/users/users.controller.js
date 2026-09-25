'use strict';
const usersService = require('./users.service');
const { sendSuccess } = require('../../utils/response.utils');

const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10, search = '', role = '' } = req.query;
  const result = await usersService.getAllUsers({
    page:   parseInt(page, 10),
    limit:  parseInt(limit, 10),
    search: search.trim(),
    role:   role.trim(),
  });
  return sendSuccess(res, result, 'Users fetched successfully');
};

const getUserById = async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  return sendSuccess(res, { user }, 'User fetched successfully');
};

const updateUser = async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body);
  return sendSuccess(res, { user }, 'User updated successfully');
};

const deleteUser = async (req, res) => {
  const result = await usersService.deleteUser(req.params.id);
  return sendSuccess(res, result, result.message);
};

const getUserStats = async (req, res) => {
  const stats = await usersService.getUserStats();
  return sendSuccess(res, stats, 'Stats fetched successfully');
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getUserStats };
