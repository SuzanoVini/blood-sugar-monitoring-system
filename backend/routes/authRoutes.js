// routes/authRoutes.js
// Author: Vinicius Suzano
// Purpose: Express route handlers for authentication endpoints including
//          user registration, login, logout, and profile retrieval

const express = require('express');
const router = express.Router();
const authAPI = require('../api/authAPI');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register new patient account
 * Body: name, email, password, healthcareNumber, dateOfBirth, phone (optional)
 */
router.post('/register', (req, res) => {
  const db = req.app.locals.db;

  // Validate required fields
  const { name, email, password, healthcareNumber, dateOfBirth } = req.body;

  if (!name || !email || !password || !healthcareNumber || !dateOfBirth) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, email, password, healthcareNumber, dateOfBirth'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateOfBirth)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  const userData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    phone: req.body.phone || null,
    healthcareNumber: healthcareNumber.trim(),
    dateOfBirth: dateOfBirth
  };

  authAPI.registerPatient(db, userData, (err, result) => {
    if (err) {
      console.error('Error registering patient:', err);

      // Check for duplicate email error
      if (err.message.includes('Email already registered')) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Check for duplicate healthcare number error
      if (err.message.includes('Duplicate entry') && err.message.includes('Healthcare_Number')) {
        return res.status(409).json({
          success: false,
          message: 'Healthcare number already exists'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error registering patient',
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: result
    });
  });
});

/**
 * POST /api/auth/login
 * User login
 * Body: email, password
 */
router.post('/login', (req, res) => {
  const db = req.app.locals.db;

  // Validate required fields
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: email, password'
    });
  }

  authAPI.loginUser(db, email.trim().toLowerCase(), password, (err, result) => {
    if (err) {
      console.error('Error logging in user:', err);

      // Check for invalid credentials or inactive account
      if (err.message.includes('Invalid email or password')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (err.message.includes('Account is not active')) {
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: err.message
      });
    }

    // Issue JWT token on successful login
    const secret = process.env.JWT_SECRET || null;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT secret not set'
      });
    }

    const payload = {
      user_id: result.User_ID,
      role: result.Role,
      name: result.Name,
      email: result.Email
    };

    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    jwt.sign(payload, secret, { expiresIn: expiresIn }, function (signErr, token) {
      if (signErr) {
        return res.status(500).json({
          success: false,
          message: 'Error generating token'
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token: token,
          user: payload
        }
      });
    });
  });
});

/**
 * POST /api/auth/logout
 * User logout (stateless endpoint)
 * Body: user_id (optional, for logging purposes)
 */
router.post('/logout', (req, res) => {
  const db = req.app.locals.db;
  const userId = req.body.user_id || null;

  if (userId) {
    authAPI.logoutUser(db, userId, (err, result) => {
      if (err) {
        console.error('Error logging out user:', err);
        return res.status(500).json({
          success: false,
          message: 'Error logging out',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } else {
    // No user_id provided, just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 * Query params: user_id (required for now, until session/JWT is implemented)
 */
router.get('/profile', (req, res) => {
  const db = req.app.locals.db;
  const userId = parseInt(req.query.user_id);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid user_id is required'
    });
  }

  authAPI.getUserProfile(db, userId, (err, result) => {
    if (err) {
      console.error('Error getting user profile:', err);

      if (err.message.includes('User not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error retrieving profile',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: result
    });
  });
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's payload from the JWT
 * Header: Authorization: Bearer <token>
 */
router.get('/me', verifyToken, function (req, res) {
  // req.user is set by verifyToken middleware
  res.json({
    success: true,
    message: 'Authenticated user retrieved',
    data: req.user
  });
});

module.exports = router;
