'use strict';
const router = require('express').Router();
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { registerSchema, loginSchema, googleLoginSchema, refreshSchema } = require('./auth.validator');

// Public routes
router.post('/register', validate(registerSchema), controller.register);
router.post('/login',    validate(loginSchema),    controller.login);
router.post('/google',   validate(googleLoginSchema), controller.googleLogin);
router.post('/refresh',  validate(refreshSchema),  controller.refreshToken);

// Protected routes
router.post('/logout', verifyToken, controller.logout);
router.get('/me',      verifyToken, controller.getMe);

module.exports = router;
