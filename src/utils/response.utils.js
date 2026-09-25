'use strict';

/**
 * Send a standardized success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

/**
 * Send a standardized error response.
 * @param {import('express').Response} res
 * @param {string} [message='Something went wrong']
 * @param {number} [statusCode=500]
 * @param {*} [errors=null]
 */
const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ success: false, message, data: null, errors });

module.exports = { sendSuccess, sendError };
