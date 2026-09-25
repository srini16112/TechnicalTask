'use strict';
const router = require('express').Router();
const { verifyToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const controller = require('./profile.controller');
const { updateProfileSchema } = require('./profile.validator');

router.use(verifyToken);
router.get('/', controller.getProfile);
router.put('/', validate(updateProfileSchema), controller.updateProfile);

module.exports = router;
