'use strict';
const router = require('express').Router();
const controller = require('./users.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateUserSchema } = require('./users.validator');

// All users routes require authentication
router.use(verifyToken);

router.get('/',        controller.getAllUsers);
router.get('/stats',   controller.getUserStats);    // Must be before /:id
router.get('/:id',     controller.getUserById);
router.put('/:id',     validate(updateUserSchema), controller.updateUser);
router.delete('/:id',  controller.deleteUser);

module.exports = router;
