'use strict';
const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  ...(env.db.url
    ? {
        connectionString: env.db.url,
        ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host:     env.db.host,
        port:     env.db.port,
        database: env.db.name,
        user:     env.db.user,
        password: env.db.password,
      }),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
