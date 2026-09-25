'use strict';
const router   = require('express').Router();
const ctrl     = require('./home-services.controller');
const { verifyToken }                                      = require('../../middlewares/auth.middleware');
const validate                                             = require('../../middlewares/validate.middleware');
const { createHomeServiceSchema, updateHomeServiceSchema } = require('./home-services.validator');

// All routes require a valid Bearer token
router.get('/',       verifyToken, ctrl.list);
router.get('/mine',   verifyToken, ctrl.myListings);
router.get('/:id',    verifyToken, ctrl.show);
router.post('/',      verifyToken, validate(createHomeServiceSchema), ctrl.create);
router.put('/:id',    verifyToken, validate(updateHomeServiceSchema), ctrl.update);
router.delete('/:id', verifyToken, ctrl.remove);

module.exports = router;
