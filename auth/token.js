const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

function verifyToken(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(403).json({ error: 'Access denied, no token provided' });
  }

  if (!token.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Invalid token format. Expected "Bearer <token>"' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded; // Add the user data to request object
    next(); // Continue to the next middleware/handler
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = verifyToken;
