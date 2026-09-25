'use strict';
const { sendError } = require('../utils/response.utils');

/**
 * Higher-order middleware factory for Joi request body validation.
 * @param {import('joi').Schema} schema - Joi schema to validate against
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field:   d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return sendError(res, 'Validation failed', 400, errors);
  }

  req.body = value; // replace with sanitized value
  next();
};

module.exports = validate;
