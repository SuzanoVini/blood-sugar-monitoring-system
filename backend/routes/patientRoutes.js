// routes/patientRoutes.js
// Author: Vinicius Suzano
// Purpose: Express route handlers for patient-specific endpoints including
//          blood sugar readings, AI suggestions, and alerts

const express = require('express');
const router = express.Router();
const patientAPI = require('../api/patientAPI');
const alertAPI = require('../api/alertAPI');
const aiProcessingAPI = require('../api/aiProcessingAPI');

// Middleware to attach patient ID from JWT token
function attachPatientIdFromJWT(req, res, next) {
  if (!req.user || !Number.isInteger(+req.user.user_id) || +req.user.user_id <= 0) {
    return res.status(401).json({
      success: false,
      message: 'Valid authenticated user required'
    });
  }

  req.patientId = +req.user.user_id;
  next();
}

// Middleware to verify patient exists and is active
function verifyPatientMiddleware(req, res, next) {
  // If the user is not a patient, skip this patient-specific verification
  if (req.user && req.user.role !== 'Patient') {
    return next();
  }

  const db = req.app.locals.db;

  patientAPI.verifyPatient(db, req.patientId, (err, result) => {
    if (err) {
      console.error('Error verifying patient:', err);
      return res.status(500).json({
        success: false,
        message: 'Error verifying patient',
        error: err.message
      });
    }

    if (!result.valid) {
      return res.status(403).json({
        success: false,
        message: result.message
      });
    }

    next();
  });
}

// Enforce that a Patient can only access their own resources
function enforcePatientOwnership(req, res, next) {
  if (req.user && req.user.role === 'Patient') {
    if (!req.user.user_id || req.user.user_id !== req.patientId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: patients can only access their own data'
      });
    }
  }
  next();
}

/**
 * GET /api/patient/readings
 * Get patient blood sugar readings with optional filtering and pagination
 * Query params: patient_id (required), startDate, endDate, category, limit, offset
 */
router.get('/readings', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const patientId = req.patientId;

  const filters = {
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    category: req.query.category || null,
    limit: req.query.limit || 50,
    offset: req.query.offset || 0
  };

  // Get total count for pagination
  patientAPI.getReadingsCount(db, patientId, filters, (err, totalCount) => {
    if (err) {
      console.error('Error getting readings count:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving readings count',
        error: err.message
      });
    }

    // Get readings
    patientAPI.getPatientReadings(db, patientId, filters, (err, readings) => {
      if (err) {
        console.error('Error getting patient readings:', err);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving readings',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: 'Readings retrieved successfully',
        data: {
          readings: readings,
          pagination: {
            total: totalCount,
            limit: parseInt(filters.limit),
            offset: parseInt(filters.offset),
            returned: readings.length
          }
        }
      });
    });
  });
});

/**
 * POST /api/patient/readings
 * Add new blood sugar reading
 * Body: patient_id, dateTime, value, unit (optional), foodNotes, activityNotes, event, symptoms, notes
 */
router.post('/readings', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const patientId = req.patientId;

  // Validate required fields
  if (!req.body.dateTime || !req.body.value) {
    return res.status(400).json({
      success: false,
      message: 'dateTime and value are required fields'
    });
  }

  // Validate value is a number
  const value = parseFloat(req.body.value);
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({
      success: false,
      message: 'value must be a positive number'
    });
  }

  const readingData = {
    dateTime: req.body.dateTime,
    value: value,
    unit: req.body.unit || 'mg/dL',
    foodNotes: req.body.foodNotes || null,
    activityNotes: req.body.activityNotes || null,
    event: req.body.event || null,
    symptoms: req.body.symptoms || null,
    notes: req.body.notes || null
  };

  patientAPI.addReading(db, patientId, readingData, (err, result) => {
    if (err) {
      console.error('Error adding reading:', err);
      return res.status(500).json({
        success: false,
        message: 'Error adding reading',
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reading added successfully',
      data: result
    });
  });
});

/**
 * PUT /api/patient/readings/:id
 * Update existing blood sugar reading
 * Params: id (reading_id)
 * Body: patient_id (required), and any fields to update
 */
router.put('/readings/:id', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const readingId = parseInt(req.params.id);
  const patientId = req.patientId;

  if (!readingId || isNaN(readingId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid reading ID is required'
    });
  }

  // Build update data from request body
  const updateData = {};

  if (req.body.dateTime !== undefined) updateData.dateTime = req.body.dateTime;
  if (req.body.value !== undefined) {
    const value = parseFloat(req.body.value);
    if (isNaN(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'value must be a positive number'
      });
    }
    updateData.value = value;
  }
  if (req.body.unit !== undefined) updateData.unit = req.body.unit;
  if (req.body.foodNotes !== undefined) updateData.foodNotes = req.body.foodNotes;
  if (req.body.activityNotes !== undefined) updateData.activityNotes = req.body.activityNotes;
  if (req.body.event !== undefined) updateData.event = req.body.event;
  if (req.body.symptoms !== undefined) updateData.symptoms = req.body.symptoms;
  if (req.body.notes !== undefined) updateData.notes = req.body.notes;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields provided for update'
    });
  }

  patientAPI.updateReading(db, readingId, patientId, updateData, (err, result) => {
    if (err) {
      console.error('Error updating reading:', err);

      if (err.message.includes('Unauthorized') || err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error updating reading',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Reading updated successfully',
      data: result
    });
  });
});

/**
 * DELETE /api/patient/readings/:id
 * Delete blood sugar reading
 * Params: id (reading_id)
 * Query/Body: patient_id (required)
 */
router.delete('/readings/:id', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const readingId = parseInt(req.params.id);
  const patientId = req.patientId;

  if (!readingId || isNaN(readingId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid reading ID is required'
    });
  }

  patientAPI.deleteReading(db, readingId, patientId, (err, result) => {
    if (err) {
      console.error('Error deleting reading:', err);

      if (err.message.includes('Unauthorized') || err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error deleting reading',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Reading deleted successfully',
      data: result
    });
  });
});

/**
 * GET /api/patient/suggestions
 * Get AI-generated suggestions for patient
 * Query params: patient_id (required), limit (optional)
 */
router.get('/suggestions', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const patientId = req.patientId;
  const limit = parseInt(req.query.limit) || 10;

  patientAPI.getPatientSuggestions(db, patientId, limit, (err, suggestions) => {
    if (err) {
      console.error('Error getting suggestions:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving suggestions',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Suggestions retrieved successfully',
      data: {
        suggestions: suggestions,
        count: suggestions.length
      }
    });
  });
});

/**
 * POST /api/patient/suggestions/generate
 * Generate new AI suggestions based on patient reading patterns
 * Body: patient_id (required)
 */
router.post('/suggestions/generate', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const patientId = req.patientId;

  aiProcessingAPI.analyzeAndCreateSuggestions(db, patientId, (err, result) => {
    if (err) {
      console.error('Error generating suggestions:', err);
      return res.status(500).json({
        success: false,
        message: 'Error generating suggestions',
        error: err.message
      });
    }

    if (result.status === 'skipped') {
      return res.json({
        success: true,
        message: `Suggestion generation skipped: ${result.reason}`,
        data: result
      });
    }

    res.json({
      success: true,
      message: `Analysis complete. Found ${result.patterns_found} patterns and created ${result.suggestions_created} new AI suggestions.`,
      data: result
    });
  });
});

/**
 * GET /api/patient/alerts
 * Get alerts for patient
 * Query params: patient_id (required)
 */
router.get('/alerts', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const patientId = req.patientId;

  alertAPI.getAlertsByPatient(db, patientId, (err, alerts) => {
    if (err) {
      console.error('Error getting alerts:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving alerts',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: {
        alerts: alerts,
        count: alerts.length
      }
    });
  });
});

/**
 * GET /api/patient/statistics
 * Get reading statistics for patient
 * Query params: patient_id (required), startDate, endDate
 */
router.get('/statistics', attachPatientIdFromJWT, verifyPatientMiddleware, enforcePatientOwnership, (req, res) => {
  const db = req.app.locals.db;
  const patientId = req.patientId;

  const filters = {
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null
  };

  patientAPI.getReadingStatistics(db, patientId, filters, (err, stats) => {
    if (err) {
      console.error('Error getting statistics:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving statistics',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    });
  });
});

module.exports = router;
