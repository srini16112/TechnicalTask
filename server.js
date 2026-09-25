'use strict';
const app = require('./src/app');
const { testConnection } = require('./src/config/db');
const env = require('./src/config/env');

const start = async () => {
  try {
    // Verify DB connection before accepting requests
    await testConnection();

    app.listen(env.port, () => {
      console.log(`\n🚀 NoBroker API Server running`);
      console.log(`   Environment : ${env.nodeEnv}`);
      console.log(`   Port        : ${env.port}`);
      console.log(`   Health      : http://localhost:${env.port}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
