'use strict';
const router   = require('express').Router();
const ctrl     = require('./properties.controller');
const { verifyToken }                          = require('../../middlewares/auth.middleware');
const validate                                 = require('../../middlewares/validate.middleware');
const { createPropertySchema, updatePropertySchema } = require('./properties.validator');

// All routes require a valid Bearer token
router.get('/',       verifyToken, ctrl.list);
router.get('/mine',   verifyToken, ctrl.myListings);
router.get('/:id',    verifyToken, ctrl.show);
router.post('/',      verifyToken, validate(createPropertySchema), ctrl.create);
router.put('/:id',    verifyToken, validate(updatePropertySchema), ctrl.update);
router.delete('/:id', verifyToken, ctrl.remove);

module.exports = router;
