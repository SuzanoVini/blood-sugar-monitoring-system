// routes/authRoutes.js
// Author: Vinicius Suzano
// Purpose: Express route handlers for authentication endpoints including
//          user registration, login, logout, and profile retrieval

const express = require('express');
const router = express.Router();
const authAPI = require('../api/authAPI');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const alertAPI = require('../api/alertAPI'); // Import alertAPI
const socketManager = require('../socketManager'); // Import socketManager

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  }
});
const upload = multer({ storage: storage });

/**
 * POST /api/auth/register
 * Register new patient account
 * Body: name, email, password, healthcareNumber, dateOfBirth, phone (optional), profileImage (optional file)
 */
router.post('/register', upload.single('profileImage'), (req, res) => {
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
    dateOfBirth: dateOfBirth,
    profileImage: req.file ? req.file.path.replace(/\\/g, "/") : null
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
  const db = req.app.locals.db;
  // req.user is set by verifyToken middleware
  res.json({
    success: true,
    message: 'Authenticated user retrieved',
    data: req.user
  });

  // If the authenticated user is a specialist, check for undelivered alerts
  if (req.user.role === 'Specialist' && req.user.user_id) {
    const specialistId = req.user.user_id;
    alertAPI.getUndeliveredAlertsForSpecialist(db, specialistId, (err, alerts) => {
      if (err) {
        console.error('Error fetching undelivered alerts for specialist:', err);
        return; // Don't block the response, just log the error
      }

      if (alerts && alerts.length > 0) {
        alerts.forEach(alert => {
          const notificationData = {
            id: `alert-${alert.Alert_ID}`,
            type: 'alert',
            title: `Alert: High Abnormal Readings for Patient ${alert.patientName}`,
            message: `Patient ${alert.patientName} (ID: ${alert.Patient_ID}) has had ${alert.Abnormal_Count} abnormal blood sugar readings this week. Please review their profile.`,
            timestamp: alert.Sent_At,
            patientId: alert.Patient_ID
          };

          socketManager.sendNotificationToUser(specialistId, notificationData);

          // Mark alert as delivered to specialist
          alertAPI.markAlertAsDeliveredToSpecialist(db, alert.Alert_ID, specialistId, (markErr) => {
            if (markErr) {
              console.error(`Error marking alert ${alert.Alert_ID} as delivered to specialist ${specialistId}:`, markErr);
            }
          });
        });
        console.log(`Delivered ${alerts.length} pending alerts to specialist ${specialistId}`);
      }
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request a password reset link
 * Body: email
 */
router.post('/forgot-password', (req, res) => {
  const db = req.app.locals.db;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  authAPI.forgotPassword(db, email, (err, result) => {
    if (err) {
      console.error('Error in forgot password:', err);
      // Always return a generic success message to prevent user enumeration
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  });
});

/**
 * POST /api/auth/reset-password/:token
 * Reset user password using a token
 * Body: password
 */
router.post('/reset-password/:token', (req, res) => {
  const db = req.app.locals.db;
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  authAPI.resetPassword(db, token, password, (err, result) => {
    if (err) {
      console.error('Error resetting password:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid or expired token.'
      });
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  });
});

module.exports = router;
