const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kindredacts_super_secret_jwt_key_2026_social_dev';

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { email, id, name }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
}

module.exports = {
  verifyJWT,
  JWT_SECRET
};
