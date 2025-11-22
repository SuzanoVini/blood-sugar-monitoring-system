// routes/thresholdRoutes.js
// Author: Gemini
// Purpose: Express route handlers specifically for managing system-wide thresholds.

const express = require('express');
const router = express.Router();
const thresholdAPI = require('../api/thresholdAPI');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/thresholds
 * Get current system threshold settings.
 * Accessible by Clinic_Staff and Administrator roles.
 */
router.get('/',
  verifyToken,
  requireRole('Clinic_Staff', 'Administrator'),
  (req, res) => {
    const db = req.app.locals.db;

    thresholdAPI.getSystemThresholds(db, (err, thresholds) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error retrieving system thresholds', error: err.message });
      }
      if (!thresholds) {
        return res.status(404).json({ success: false, message: 'No system thresholds have been configured.' });
      }
      res.json({ success: true, message: 'System thresholds retrieved successfully.', data: thresholds });
    });
  }
);

/**
 * PUT /api/thresholds
 * Update system threshold settings.
 * Accessible by Clinic_Staff and Administrator roles.
 */
router.put('/',
  verifyToken,
  requireRole('Clinic_Staff', 'Administrator'),
  (req, res) => {
    const db = req.app.locals.db;
    const { Normal_Low, Normal_High, Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High } = req.body;

    const requiredFields = { Normal_Low, Normal_High, Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High };
    for (const field in requiredFields) {
      if (requiredFields[field] === undefined || requiredFields[field] === null) {
        return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
      }
    }

    const thresholdData = {
      normal_low: parseFloat(Normal_Low),
      normal_high: parseFloat(Normal_High),
      borderline_low: parseFloat(Borderline_Low),
      borderline_high: parseFloat(Borderline_High),
      abnormal_low: parseFloat(Abnormal_Low),
      abnormal_high: parseFloat(Abnormal_High)
    };

    // Simple validation for numbers
    for (const key in thresholdData) {
      if (isNaN(thresholdData[key])) {
        return res.status(400).json({ success: false, message: `All threshold values must be valid numbers. Error at: ${key}` });
      }
    }

    // Add more detailed validation here if necessary (e.g., ranges, consistency)

    thresholdAPI.updateSystemThresholds(db, thresholdData, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating system thresholds', error: err.message });
      }

      console.log(`System thresholds updated by user ${req.user.user_id}, new Threshold_ID: ${result.threshold_id}`);
      res.status(201).json({ success: true, message: 'System thresholds updated successfully', data: result });
    });
  }
);

/**
 * DELETE /api/thresholds
 * Delete a threshold by ID or latest if no ID provided.
 * Query parameter: id (optional) - Threshold_ID to delete
 * Accessible by Clinic_Staff and Administrator roles.
 */
router.delete('/',
  verifyToken,
  requireRole('Clinic_Staff', 'Administrator'),
  (req, res) => {
    const db = req.app.locals.db;
    const thresholdId = req.query.id ? parseInt(req.query.id) : null;

    // Validate ID if provided
    if (req.query.id && (isNaN(thresholdId) || thresholdId <= 0)) {
      return res.status(400).json({ success: false, message: 'Invalid threshold ID' });
    }

    thresholdAPI.deleteThreshold(db, thresholdId, (err, result) => {
      if (err) {
        console.error('Error deleting threshold:', err);

        if (err.message.includes('not found')) {
          return res.status(404).json({ success: false, message: err.message });
        }

        return res.status(500).json({ success: false, message: 'Error deleting threshold', error: err.message });
      }

      console.log(`Threshold deleted by user ${req.user.user_id}, Threshold_ID: ${result.threshold_id}`);
      res.json({ success: true, message: 'Threshold deleted successfully', data: result });
    });
  }
);

module.exports = router;
