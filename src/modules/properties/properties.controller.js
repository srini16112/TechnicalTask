'use strict';
const service        = require('./properties.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

/**
 * GET /api/properties
 * Public-facing paginated list with filters via query string.
 */
const list = async (req, res) => {
  const result = await service.getProperties(req.query);
  sendSuccess(res, result, 'Properties fetched successfully');
};

/**
 * GET /api/properties/mine
 * All listings belonging to the authenticated user.
 */
const myListings = async (req, res) => {
  const properties = await service.getMyProperties(req.user.id);
  sendSuccess(res, { properties }, 'Your properties fetched successfully');
};

/**
 * GET /api/properties/:id
 * Single property with owner details.
 */
const show = async (req, res) => {
  const property = await service.getPropertyById(req.params.id);
  sendSuccess(res, { property }, 'Property fetched successfully');
};

/**
 * POST /api/properties
 * Create a new property listing (authenticated).
 */
const create = async (req, res) => {
  const property = await service.createProperty(req.user.id, req.body);
  sendSuccess(res, { property }, 'Property created successfully', 201);
};

/**
 * PUT /api/properties/:id
 * Update an existing property (owner only).
 */
const update = async (req, res) => {
  const property = await service.updateProperty(req.params.id, req.user.id, req.body);
  sendSuccess(res, { property }, 'Property updated successfully');
};

/**
 * DELETE /api/properties/:id
 * Delete a property (owner only).
 */
const remove = async (req, res) => {
  const result = await service.deleteProperty(req.params.id, req.user.id);
  sendSuccess(res, result, result.message);
};

module.exports = { list, myListings, show, create, update, remove };
