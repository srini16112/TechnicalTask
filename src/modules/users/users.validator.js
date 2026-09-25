'use strict';
const Joi = require('joi');

const updateUserSchema = Joi.object({
  fullName:  Joi.string().trim().min(2).max(100).optional(),
  phone:     Joi.string().trim().pattern(/^[6-9]\d{9}$/).optional().allow('', null),
  avatarUrl: Joi.string().uri().optional().allow('', null),
  role:      Joi.string().valid('user', 'admin').optional(),
  isActive:  Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

module.exports = { updateUserSchema };
