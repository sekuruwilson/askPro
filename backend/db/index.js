const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Execute a SQL query against the pool.
 * @param {string} text  - SQL statement
 * @param {Array}  params - Parameterised values
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
