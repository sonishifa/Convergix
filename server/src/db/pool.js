// server/src/db/pool.js
const { Pool }  = require('pg');
const logger    = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max:              10,          // max connections in pool
  idleTimeoutMillis: 30_000,    // close idle connections after 30s
  connectionTimeoutMillis: 5000, // fail fast if PG is unreachable
});

pool.on('error', err => logger.error('PG pool background error', { error: err.message }));

module.exports = { pool };