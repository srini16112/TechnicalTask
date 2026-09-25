'use strict';
const service                    = require('./home-services.service');
const { sendSuccess }            = require('../../utils/response.utils');

/**
 * GET /api/home-services
 * Paginated list with optional filters from query string.
 */
const list = async (req, res) => {
  const result = await service.getServices(req.query);
  sendSuccess(res, result, 'Home services fetched successfully');
};

/**
 * GET /api/home-services/mine
 * All service listings belonging to the authenticated user.
 */
const myListings = async (req, res) => {
  const services = await service.getMyServices(req.user.id);
  sendSuccess(res, { services }, 'Your home services fetched successfully');
};

/**
 * GET /api/home-services/:id
 * Single service with owner details.
 */
const show = async (req, res) => {
  const svc = await service.getServiceById(req.params.id);
  sendSuccess(res, { service: svc }, 'Home service fetched successfully');
};

/**
 * POST /api/home-services
 * Create a new home service listing (authenticated).
 */
const create = async (req, res) => {
  const svc = await service.createService(req.user.id, req.body);
  sendSuccess(res, { service: svc }, 'Home service created successfully', 201);
};

/**
 * PUT /api/home-services/:id
 * Update an existing home service (owner only).
 */
const update = async (req, res) => {
  const svc = await service.updateService(req.params.id, req.user.id, req.body);
  sendSuccess(res, { service: svc }, 'Home service updated successfully');
};

/**
 * DELETE /api/home-services/:id
 * Delete a home service (owner only).
 */
const remove = async (req, res) => {
  const result = await service.deleteService(req.params.id, req.user.id);
  sendSuccess(res, result, result.message);
};

module.exports = { list, myListings, show, create, update, remove };
