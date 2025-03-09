const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();  // Ensure environment variables are loaded

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
});

module.exports = pool;
