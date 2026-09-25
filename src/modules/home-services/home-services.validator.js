'use strict';
const Joi = require('joi');

/**
 * Joi schema for creating a home service listing.
 */
const createHomeServiceSchema = Joi.object({
  title:            Joi.string().trim().min(5).max(200).required(),
  description:      Joi.string().trim().max(2000).optional().allow('', null),
  category:         Joi.string()
                      .valid(
                        'electrical', 'plumbing', 'painting', 'carpentry',
                        'cleaning', 'pest_control', 'appliance_repair',
                        'gardening', 'security', 'moving', 'other'
                      )
                      .required(),
  price_type:       Joi.string().valid('fixed', 'hourly', 'negotiable').optional(),
  price:            Joi.number().min(0).optional().allow(null),
  location:         Joi.string().trim().min(2).max(200).required(),
  city:             Joi.string().trim().max(100).optional().allow('', null),
  state:            Joi.string().trim().max(100).optional().allow('', null),
  experience_years: Joi.number().integer().min(0).optional(),
  is_available:     Joi.boolean().optional(),
  images:           Joi.array().items(Joi.string().uri()).max(20).optional(),
  provider_name:    Joi.string().trim().min(2).max(100).required(),
  provider_phone:   Joi.string().trim().max(15).required(),
  provider_email:   Joi.string().email().optional().allow('', null),
});

/**
 * Joi schema for updating a home service listing.
 * All fields optional; requires at least one field to be present.
 */
const updateHomeServiceSchema = createHomeServiceSchema.fork(
  ['title', 'category', 'location', 'provider_name', 'provider_phone'],
  (field) => field.optional()
).min(1);

module.exports = { createHomeServiceSchema, updateHomeServiceSchema };
