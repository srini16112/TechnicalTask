'use strict';
const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'string.min':  'Full name must be at least 2 characters',
    'any.required': 'Full name is required',
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.email':  'Please enter a valid email address',
    'any.required':  'Email is required',
  }),
  phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number',
    'any.required':        'Phone number is required',
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min':  'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

const loginSchema = Joi.object({
  email:    Joi.string().trim().email().lowercase().required(),
  password: Joi.string().required(),
});

const googleLoginSchema = Joi.object({
  idToken: Joi.string().trim().min(20).max(10000),
  credential: Joi.string().trim().min(20).max(10000),
}).or('idToken', 'credential').messages({
  'object.missing': 'Google ID token is required',
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

module.exports = { registerSchema, loginSchema, googleLoginSchema, refreshSchema };
