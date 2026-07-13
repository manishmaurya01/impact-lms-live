const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ [AUTH_ERROR]: JWT_SECRET is not set in .env file. Authentication will not work.');
}

const authorizeToken = (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server authentication is misconfigured.' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Authorization token missing.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Token expired or invalid.' });
    req.user = decoded;
    next();
  });
};

module.exports = authorizeToken;