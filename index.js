const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const verifyToken = require('./auth/token');
const userRoute = require('./routes/userRoutes');
const busRoute = require('./routes/busRoutes');

// Initialize dotenv for environment variables
dotenv.config();

// Create Express app
const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
});

// Routes for user-related functionality (user registration, login)
app.use('/api/users', userRoute); 

// Routes for bus-related functionality (bus and schedule management)
app.use('/api', busRoute); 


app.use('/', (req, res) => {
  res.send('Server is running successfully!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
