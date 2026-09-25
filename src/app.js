'use strict';
require('express-async-errors');

const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const morgan   = require('morgan');

const authRoutes  = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const propertiesRoutes = require('./modules/properties/properties.routes');
const homeServicesRoutes = require('./modules/home-services/home-services.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { sendSuccess, sendError } = require('./utils/response.utils');

const app = express();

// ─── Security & Parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'Server is running')
);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/home-services', homeServicesRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => sendError(res, `Route ${req.method} ${req.path} not found`, 404));

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
