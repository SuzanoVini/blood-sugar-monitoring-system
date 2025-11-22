// routes/staffRoutes.js
// Author: Vinicius Suzano
// Purpose: Express route handlers for clinic staff endpoints including
//          threshold management and read-only patient access

const express = require('express');
const router = express.Router();
const thresholdAPI = require('../api/thresholdAPI');
const staffAPI = require('../api/staffAPI'); // Import staffAPI
const { verifyToken, requireRole } = require('../middleware/auth'); // Import auth middleware

// Middleware to validate staff_id from request - REMOVED

/**
 * GET /api/staff/thresholds
 * Get current system threshold settings
 * Accessible by Clinic_Staff and Administrator roles.
 * Response: { success, message, data: { Threshold_ID, Normal_Low, Normal_High, ..., Effective_Date } }
 */
router.get('/thresholds', verifyToken, requireRole('Clinic_Staff', 'Administrator'), (req, res) => {
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
 * Accessible by Clinic_Staff and Administrator roles.
 * Body: Normal_Low, Normal_High, Borderline_Low, Borderline_High,
 *       Abnormal_Low, Abnormal_High (all required)
 * Response: { success, message, data: { threshold_id } }
 */
router.put('/thresholds', verifyToken, requireRole('Clinic_Staff', 'Administrator'), (req, res) => {
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

    console.log(`System thresholds updated by user ${req.user.user_id}, new Threshold_ID: ${result.threshold_id}`);

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
 * DELETE /api/staff/thresholds
 * Delete a threshold by ID or latest if no ID provided
 * Accessible by Clinic_Staff and Administrator roles.
 * Query parameter: id (optional) - Threshold_ID to delete
 * Response: { success, message, data: { threshold_id, deleted } }
 */
router.delete('/thresholds', verifyToken, requireRole('Clinic_Staff', 'Administrator'), (req, res) => {
  const db = req.app.locals.db;
  const thresholdId = req.query.id ? parseInt(req.query.id) : null;

  // Validate ID if provided
  if (req.query.id && (isNaN(thresholdId) || thresholdId <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid threshold ID'
    });
  }

  thresholdAPI.deleteThreshold(db, thresholdId, (err, result) => {
    if (err) {
      console.error('Error deleting threshold:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error deleting threshold',
        error: err.message
      });
    }

    console.log(`Threshold deleted by user ${req.user.user_id}, Threshold_ID: ${result.threshold_id}`);

    res.status(200).json({
      success: true,
      message: 'Threshold deleted successfully',
      data: result
    });
  });
});

/**
 * GET /api/staff/patients
 * Get read-only list of all patients
 * Accessible by Clinic_Staff and Administrator roles.
 * Query: limit (optional), offset (optional)
 * Response: { success, message, data: [{ Patient_ID, Name, Email, Healthcare_Number, Date_Of_Birth,
 *             Status, Threshold_Normal_Low, Threshold_Normal_High }] }
 */
router.get('/patients', verifyToken, requireRole('Clinic_Staff', 'Administrator'), (req, res) => {
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

/**
 * GET /api/staff/patients/:patientId
 * Get details for a specific patient.
 * Accessible by Clinic_Staff and Administrator roles.
 */
router.get('/patients/:patientId', verifyToken, requireRole('Clinic_Staff', 'Administrator'), (req, res) => {
  const db = req.app.locals.db;
  const patientId = parseInt(req.params.patientId);

  if (isNaN(patientId)) {
    return res.status(400).json({ success: false, message: 'Invalid patient ID' });
  }

  staffAPI.getStaffPatientDetails(db, patientId, (err, patient) => {
    if (err) {
      console.error('Error retrieving patient details:', err);
      return res.status(500).json({ success: false, message: 'Error retrieving patient details' });
    }
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.json({ success: true, message: 'Patient details retrieved', data: patient });
  });
});

/**
 * GET /api/staff/patients/:patientId/readings
 * Get all readings for a specific patient.
 * Accessible by Clinic_Staff and Administrator roles.
 */
router.get('/patients/:patientId/readings', verifyToken, requireRole('Clinic_Staff', 'Administrator'), (req, res) => {
  const db = req.app.locals.db;
  const patientId = parseInt(req.params.patientId);

  if (isNaN(patientId)) {
    return res.status(400).json({ success: false, message: 'Invalid patient ID' });
  }

  // Optional filters for readings (e.g., date range, category) can be added here
  const filters = {
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    category: req.query.category || null,
    limit: req.query.limit || null,
    offset: req.query.offset || null,
  };

  staffAPI.getStaffPatientReadings(db, patientId, filters, (err, readings) => {
    if (err) {
      console.error('Error retrieving patient readings:', err);
      return res.status(500).json({ success: false, message: 'Error retrieving patient readings' });
    }
    res.json({ success: true, message: 'Patient readings retrieved', data: readings });
  });
});

/**
 * GET /api/staff/patients/:patientId/feedback
 * Get all feedback for a specific patient.
 * Accessible by Clinic_Staff and Administrator roles.
 */
router.get('/patients/:patientId/feedback', verifyToken, requireRole('Clinic_Staff', 'Administrator'), (req, res) => {
  const db = req.app.locals.db;
  const patientId = parseInt(req.params.patientId);

  if (isNaN(patientId)) {
    return res.status(400).json({ success: false, message: 'Invalid patient ID' });
  }

  staffAPI.getStaffPatientFeedback(db, patientId, (err, feedback) => {
    if (err) {
      console.error('Error retrieving patient feedback:', err);
      return res.status(500).json({ success: false, message: 'Error retrieving patient feedback' });
    }
    res.json({ success: true, message: 'Patient feedback retrieved', data: feedback });
  });
});

module.exports = router;
