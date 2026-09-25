'use strict';
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    url:      process.env.DATABASE_URL || '',
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 5432,
    name:     process.env.DB_NAME     || 'nobroker_db',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    accessSecret:    process.env.JWT_ACCESS_SECRET  || 'change_me_access_secret_32_chars_min',
    refreshSecret:   process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret_32_chars_min',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
    refreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
};
