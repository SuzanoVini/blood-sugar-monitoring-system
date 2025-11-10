// routes/specialistRoutes.js
// Author: Vinicius Suzano
// Purpose: Express route handlers for specialist operations including viewing patient data,
//          providing feedback, and accessing assigned patient information

const express = require('express');
const router = express.Router();
const specialistAPI = require('../api/specialistAPI');

// Middleware to validate specialist ID from request
function validateSpecialistId(req, res, next) {
  const specialistId = parseInt(req.body.specialist_id || req.query.specialist_id || req.params.specialist_id);

  if (!specialistId || isNaN(specialistId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid specialist_id is required'
    });
  }

  req.specialistId = specialistId;
  next();
}

// Middleware to verify specialist exists and is active
function verifySpecialistMiddleware(req, res, next) {
  const db = req.app.locals.db;

  specialistAPI.verifySpecialist(db, req.specialistId, (err, result) => {
    if (err) {
      console.error('Error verifying specialist:', err);
      return res.status(500).json({
        success: false,
        message: 'Error verifying specialist',
        error: err.message
      });
    }

    if (!result.valid) {
      return res.status(403).json({
        success: false,
        message: result.message
      });
    }

    req.specialistInfo = result;
    next();
  });
}

/**
 * GET /api/specialist/patients
 * Get all patients assigned to the specialist
 * Query params: specialist_id (required)
 */
router.get('/patients', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;

  specialistAPI.getAssignedPatients(db, specialistId, (err, patients) => {
    if (err) {
      console.error('Error getting assigned patients:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving assigned patients',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Assigned patients retrieved successfully',
      data: {
        patients: patients,
        count: patients.length
      }
    });
  });
});

/**
 * GET /api/specialist/patients/:id
 * Get detailed information about a specific patient
 * Params: id (patient_id)
 * Query params: specialist_id (required)
 */
router.get('/patients/:id', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;
  const patientId = parseInt(req.params.id);

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid patient ID is required'
    });
  }

  specialistAPI.getPatientDetails(db, specialistId, patientId, (err, patientDetails) => {
    if (err) {
      console.error('Error getting patient details:', err);

      if (err.message.includes('not assigned')) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this patient'
        });
      }

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error retrieving patient details',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Patient details retrieved successfully',
      data: patientDetails
    });
  });
});

/**
 * GET /api/specialist/patients/:id/readings
 * Get reading history for a specific patient
 * Params: id (patient_id)
 * Query params: specialist_id (required), startDate, endDate, category, limit, offset
 */
router.get('/patients/:id/readings', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;
  const patientId = parseInt(req.params.id);

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid patient ID is required'
    });
  }

  const filters = {
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    category: req.query.category || null,
    limit: req.query.limit || 100,
    offset: req.query.offset || 0
  };

  specialistAPI.getPatientReadingHistory(db, specialistId, patientId, filters, (err, readings) => {
    if (err) {
      console.error('Error getting patient readings:', err);

      if (err.message.includes('not assigned')) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this patient'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error retrieving patient readings',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Patient readings retrieved successfully',
      data: {
        readings: readings,
        count: readings.length
      }
    });
  });
});

/**
 * GET /api/specialist/patients/:id/alerts
 * Get alerts for a specific patient
 * Params: id (patient_id)
 * Query params: specialist_id (required), limit (optional)
 */
router.get('/patients/:id/alerts', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;
  const patientId = parseInt(req.params.id);
  const limit = parseInt(req.query.limit) || 10;

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid patient ID is required'
    });
  }

  specialistAPI.getPatientAlerts(db, specialistId, patientId, limit, (err, alerts) => {
    if (err) {
      console.error('Error getting patient alerts:', err);

      if (err.message.includes('not assigned')) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this patient'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error retrieving patient alerts',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Patient alerts retrieved successfully',
      data: {
        alerts: alerts,
        count: alerts.length
      }
    });
  });
});

/**
 * POST /api/specialist/feedback
 * Provide feedback to a patient
 * Body: specialist_id (required), patient_id (required), content (required)
 */
router.post('/feedback', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;

  // Validate patient_id
  const patientId = parseInt(req.body.patient_id);
  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid patient_id is required'
    });
  }

  // Validate content
  if (!req.body.content || req.body.content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Feedback content is required and cannot be empty'
    });
  }

  const content = req.body.content.trim();

  specialistAPI.createFeedback(db, specialistId, patientId, content, (err, feedback) => {
    if (err) {
      console.error('Error creating feedback:', err);

      if (err.message.includes('not assigned')) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this patient'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error creating feedback',
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: feedback
    });
  });
});

/**
 * GET /api/specialist/feedback/:patient_id
 * Get feedback history for a specific patient
 * Params: patient_id
 * Query params: specialist_id (required), limit (optional)
 */
router.get('/feedback/:patient_id', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;
  const patientId = parseInt(req.params.patient_id);
  const limit = parseInt(req.query.limit) || 10;

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid patient_id is required'
    });
  }

  specialistAPI.getPatientFeedbackHistory(db, specialistId, patientId, limit, (err, feedbackList) => {
    if (err) {
      console.error('Error getting feedback history:', err);

      if (err.message.includes('not assigned')) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this patient'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error retrieving feedback history',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Feedback history retrieved successfully',
      data: {
        feedback: feedbackList,
        count: feedbackList.length
      }
    });
  });
});

/**
 * GET /api/specialist/feedback
 * Get all feedback created by the specialist
 * Query params: specialist_id (required), limit (optional)
 */
router.get('/feedback', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;
  const limit = parseInt(req.query.limit) || 20;

  specialistAPI.getSpecialistFeedbackHistory(db, specialistId, limit, (err, feedbackList) => {
    if (err) {
      console.error('Error getting specialist feedback history:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving feedback history',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Feedback history retrieved successfully',
      data: {
        feedback: feedbackList,
        count: feedbackList.length
      }
    });
  });
});

/**
 * GET /api/specialist/dashboard
 * Get dashboard statistics for specialist
 * Query params: specialist_id (required)
 */
router.get('/dashboard', validateSpecialistId, verifySpecialistMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const specialistId = req.specialistId;

  specialistAPI.getSpecialistDashboardStats(db, specialistId, (err, stats) => {
    if (err) {
      console.error('Error getting dashboard statistics:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving dashboard statistics',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  });
});

module.exports = router;
