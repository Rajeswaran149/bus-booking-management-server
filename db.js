const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();  

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, 
  ssl: {
    rejectUnauthorized: false,  
  },
});

module.exports = pool;
