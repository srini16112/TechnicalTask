'use strict';
const Joi = require('joi');

const updateProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).optional().allow('', null),
  avatarUrl: Joi.string().uri().optional().allow('', null),
  bio: Joi.string().trim().max(1000).optional().allow('', null),
  address: Joi.string().trim().max(300).optional().allow('', null),
  city: Joi.string().trim().max(100).optional().allow('', null),
  state: Joi.string().trim().max(100).optional().allow('', null),
  postalCode: Joi.string().trim().max(20).optional().allow('', null),
  website: Joi.string().uri().optional().allow('', null),
}).min(1);

module.exports = { updateProfileSchema };
