'use strict';
const Joi = require('joi');

/**
 * Joi schema for creating a property listing.
 * All required fields are enforced; optional fields strip unknown keys.
 */
const createPropertySchema = Joi.object({
  title:            Joi.string().trim().min(5).max(200).required(),
  description:      Joi.string().trim().max(2000).optional().allow('', null),
  listing_type:     Joi.string().valid('rent', 'buy').required(),
  property_type:    Joi.string().valid('full_home', 'pg', 'hostel', 'apartment', 'villa').required(),
  bhk:              Joi.number().integer().min(1).max(10).optional().allow(null),
  price:            Joi.number().min(0).required(),
  price_negotiable: Joi.boolean().optional(),
  location:         Joi.string().trim().min(2).max(200).required(),
  city:             Joi.string().trim().max(100).optional().allow('', null),
  state:            Joi.string().trim().max(100).optional().allow('', null),
  pincode:          Joi.string().trim().max(10).optional().allow('', null),
  area_sqft:        Joi.number().min(0).optional().allow(null),
  furnishing:       Joi.string().valid('unfurnished', 'semi_furnished', 'fully_furnished').optional(),
  floor:            Joi.number().integer().optional().allow(null),
  total_floors:     Joi.number().integer().optional().allow(null),
  parking:          Joi.boolean().optional(),
  amenities:        Joi.array().items(Joi.string().trim()).optional(),
  available_from:   Joi.date().iso().optional().allow(null),
  is_available:     Joi.boolean().optional(),
  images:           Joi.array().items(Joi.string().uri()).max(20).optional(),
  contact_name:     Joi.string().trim().max(100).optional().allow('', null),
  contact_phone:    Joi.string().trim().max(15).optional().allow('', null),
  contact_email:    Joi.string().email().optional().allow('', null),
});

/**
 * Joi schema for updating a property listing.
 * All fields optional; requires at least one field to be present.
 */
const updatePropertySchema = createPropertySchema.fork(
  ['title', 'listing_type', 'property_type', 'price', 'location'],
  (field) => field.optional()
).min(1);

module.exports = { createPropertySchema, updatePropertySchema };
