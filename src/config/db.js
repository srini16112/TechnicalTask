'use strict';
const { Pool } = require('pg');
const env = require('./env');

const isRemote = env.db.host && env.db.host !== 'localhost' && env.db.host !== '127.0.0.1';
const useSSL = process.env.DB_SSL === 'true' || isRemote || env.nodeEnv === 'production';

const pool = new Pool({
  ...(env.db.url
    ? {
        connectionString: env.db.url,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host:     env.db.host,
        port:     env.db.port,
        database: env.db.name,
        user:     env.db.user,
        password: env.db.password,
        ssl:      useSSL ? { rejectUnauthorized: false } : undefined,
      }),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text   - SQL query string
 * @param {Array}  params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Test the database connection.
 */
const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log(`✅ PostgreSQL connected → ${env.db.host}:${env.db.port}/${env.db.name}`);
  } finally {
    client.release();
  }
};

module.exports = { query, pool, testConnection };
