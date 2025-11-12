// routes/staffRoutes.js
// Author: Vinicius Suzano
// Purpose: Express route handlers for clinic staff endpoints including
//          threshold management and read-only patient access

const express = require('express');
const router = express.Router();
const thresholdAPI = require('../api/thresholdAPI');

// Middleware to validate staff_id from request
function validateStaffId(req, res, next) {
  const staffId = parseInt(req.body.staff_id || req.query.staff_id);

  if (!staffId || isNaN(staffId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid staff_id is required'
    });
  }

  req.staffId = staffId;
  next();
}

// Middleware to verify staff role (interim solution until auth middleware)
function verifyStaffRole(req, res, next) {
  const db = req.app.locals.db;

  const query = 'SELECT Role, Status FROM User WHERE User_ID = ?';
  db.query(query, [req.staffId], (err, results) => {
    if (err) {
      console.error('Error verifying staff role:', err);
      return res.status(500).json({
        success: false,
        message: 'Error verifying staff role'
      });
    }

    if (results.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: User not found'
      });
    }

    const user = results[0];

    if (user.Role !== 'Clinic_Staff') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Clinic Staff role required'
      });
    }

    if (user.Status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Account is not active'
      });
    }

    next();
  });
}

/**
 * GET /api/staff/thresholds
 * Get current system threshold settings
 * Query: staff_id (required)
 * Response: { success, message, data: { Threshold_ID, Normal_Low, Normal_High, ..., Effective_Date } }
 */
router.get('/thresholds', validateStaffId, verifyStaffRole, (req, res) => {
  const db = req.app.locals.db;

  thresholdAPI.getSystemThresholds(db, (err, thresholds) => {
    if (err) {
      console.error('Error retrieving system thresholds:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving system thresholds'
      });
    }

    if (!thresholds) {
      return res.status(404).json({
        success: false,
        message: 'No system thresholds found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'System thresholds retrieved successfully',
      data: thresholds
    });
  });
});

/**
 * PUT /api/staff/thresholds
 * Update system threshold settings (creates new versioned record)
 * Body: staff_id (required), Normal_Low, Normal_High, Borderline_Low, Borderline_High,
 *       Abnormal_Low, Abnormal_High (all required)
 * Response: { success, message, data: { threshold_id } }
 */
router.put('/thresholds', validateStaffId, verifyStaffRole, (req, res) => {
  const db = req.app.locals.db;

  const {
    Normal_Low,
    Normal_High,
    Borderline_Low,
    Borderline_High,
    Abnormal_Low,
    Abnormal_High
  } = req.body;

  // Validate all required fields are present
  if (
    Normal_Low === undefined ||
    Normal_High === undefined ||
    Borderline_Low === undefined ||
    Borderline_High === undefined ||
    Abnormal_Low === undefined ||
    Abnormal_High === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: Normal_Low, Normal_High, Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High'
    });
  }

  // Convert to numbers
  const normalLow = parseFloat(Normal_Low);
  const normalHigh = parseFloat(Normal_High);
  const borderlineLow = parseFloat(Borderline_Low);
  const borderlineHigh = parseFloat(Borderline_High);
  const abnormalLow = parseFloat(Abnormal_Low);
  const abnormalHigh = parseFloat(Abnormal_High);

  // Validate all fields are valid numbers
  if (
    isNaN(normalLow) ||
    isNaN(normalHigh) ||
    isNaN(borderlineLow) ||
    isNaN(borderlineHigh) ||
    isNaN(abnormalLow) ||
    isNaN(abnormalHigh)
  ) {
    return res.status(400).json({
      success: false,
      message: 'All threshold values must be valid numbers'
    });
  }

  // Validate reasonable value ranges (0 < value < 1000 for mg/dL)
  if (
    normalLow <= 0 || normalLow >= 1000 ||
    normalHigh <= 0 || normalHigh >= 1000 ||
    borderlineLow <= 0 || borderlineLow >= 1000 ||
    borderlineHigh <= 0 || borderlineHigh >= 1000 ||
    abnormalLow <= 0 || abnormalLow >= 1000 ||
    abnormalHigh <= 0 || abnormalHigh >= 1000
  ) {
    return res.status(400).json({
      success: false,
      message: 'All threshold values must be between 0 and 1000 mg/dL'
    });
  }

  // Validate logical consistency of ranges
  if (normalLow >= normalHigh) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Normal range: Normal_Low must be less than Normal_High'
    });
  }

  if (borderlineLow < normalHigh) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Borderline range: Borderline_Low must be greater than or equal to Normal_High'
    });
  }

  if (borderlineLow >= borderlineHigh) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Borderline range: Borderline_Low must be less than Borderline_High'
    });
  }

  if (abnormalLow > borderlineLow) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Abnormal range: Abnormal_Low must be less than or equal to Borderline_Low'
    });
  }

  if (abnormalHigh < borderlineHigh) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Abnormal range: Abnormal_High must be greater than or equal to Borderline_High'
    });
  }

  // Prepare threshold data for API (using lowercase keys as per thresholdAPI)
  const thresholdData = {
    normal_low: normalLow,
    normal_high: normalHigh,
    borderline_low: borderlineLow,
    borderline_high: borderlineHigh,
    abnormal_low: abnormalLow,
    abnormal_high: abnormalHigh
  };

  thresholdAPI.updateSystemThresholds(db, thresholdData, (err, result) => {
    if (err) {
      console.error('Error updating system thresholds:', err);
      return res.status(500).json({
        success: false,
        message: 'Error updating system thresholds'
      });
    }

    console.log(`System thresholds updated by staff ${req.staffId}, new Threshold_ID: ${result.threshold_id}`);

    res.status(201).json({
      success: true,
      message: 'System thresholds updated successfully',
      data: {
        threshold_id: result.threshold_id,
        thresholds: thresholdData
      }
    });
  });
});

/**
 * GET /api/staff/patients
 * Get read-only list of all patients
 * Query: staff_id (required), limit (optional), offset (optional)
 * Response: { success, message, data: [{ Patient_ID, Name, Email, Healthcare_Number, Date_Of_Birth,
 *             Status, Threshold_Normal_Low, Threshold_Normal_High }] }
 */
router.get('/patients', validateStaffId, verifyStaffRole, (req, res) => {
  const db = req.app.locals.db;

  // Get optional pagination parameters
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;

  // Validate pagination parameters if provided
  if (limit !== null && (isNaN(limit) || limit <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid limit parameter: must be a positive integer'
    });
  }

  if (isNaN(offset) || offset < 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid offset parameter: must be a non-negative integer'
    });
  }

  // Build query with JOIN to get both User and Patient data
  let query = `
    SELECT
      p.Patient_ID,
      u.Name,
      u.Email,
      u.Status,
      p.Healthcare_Number,
      p.Date_Of_Birth,
      p.Threshold_Normal_Low,
      p.Threshold_Normal_High
    FROM Patient p
    INNER JOIN User u ON p.Patient_ID = u.User_ID
    ORDER BY u.Name ASC
  `;

  const queryParams = [];

  // Add pagination if limit is provided
  if (limit !== null) {
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error retrieving patient list:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving patient list'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient list retrieved successfully',
      data: results
    });
  });
});

module.exports = router;
