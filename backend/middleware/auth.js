// middleware/auth.js
// Author: Vinicius Suzano
// JWT authentication and role-based authorization middleware (callback style)

const jwt = require('jsonwebtoken');

function getJwtSecret() {
  return process.env.JWT_SECRET || null;
}

// Verifies Bearer token and attaches user payload to req.user
function verifyToken(req, res, next) {
  const authHeader = req.headers && req.headers.authorization ? req.headers.authorization : null;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required'
    });
  }

  const token = authHeader.slice(7).trim();
  const secret = getJwtSecret();
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT secret not set'
    });
  }

  jwt.verify(token, secret, function (err, decoded) {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Expecting payload fields: user_id, role, name, email
    req.user = {
      user_id: decoded && decoded.user_id ? decoded.user_id : null,
      role: decoded && decoded.role ? decoded.role : null,
      name: decoded && decoded.name ? decoded.name : null,
      email: decoded && decoded.email ? decoded.email : null
    };

    if (!req.user.user_id || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    next();
  });
}

// Factory that enforces one of the allowed roles
function requireRole() {
  const allowed = Array.prototype.slice.call(arguments);
  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    if (allowed.indexOf(req.user.role) === -1) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient role'
      });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireRole
};

