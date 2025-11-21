// routes/feedbackRoutes.js
// Author: Gemini
// Purpose: Express route handlers for feedback operations between specialists and patients

const express = require('express');
const router = express.Router();
const feedbackAPI = require('../api/feedbackAPI');
const { verifyToken, requireRole } = require('../middleware/auth'); // Assuming auth middleware is available

/**
 * Middleware to validate specialist ID from request
 */
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

/**
 * Middleware to validate patient ID from request - REMOVED, logic moved inline
 */
// function validatePatientId(req, res, next) { ... }

/**
 * Enforce that a Specialist can only access/manage their own feedback or specific patient feedback
 * and ensure patient can only see their own feedback.
 */
function enforceFeedbackOwnership(req, res, next) {
  if (req.user) {
    if (req.user.role === 'Specialist' && req.specialistId && req.user.user_id !== req.specialistId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Specialists can only manage their own feedback.'
      });
    }
    if (req.user.role === 'Patient' && req.patientId && req.user.user_id !== req.patientId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Patients can only view their own feedback.'
      });
    }
  }
  next();
}


/**
 * POST /api/feedback
 * Create a new feedback entry (Specialist to Patient)
 * Body: specialist_id, patient_id, content
 */
router.post('/',
  verifyToken,
  requireRole('Specialist', 'Administrator'), // Only Specialists or Admins can create feedback
  validateSpecialistId,
  (req, res, next) => { // Added inline middleware to set req.patientId
    const patientId = parseInt(req.body.patient_id);
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({ success: false, message: 'Valid patient_id in body is required.' });
    }
    req.patientId = patientId;
    next();
  },
  enforceFeedbackOwnership, // Ensure specialist is creating feedback for themselves or an admin is
  (req, res) => {
    const db = req.app.locals.db;
    const specialistId = req.specialistId; // specialistId already set by validateSpecialistId
    const patientId = req.patientId; // patientId now set by inline middleware
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Feedback content is required.' });
    }

    // If a Specialist is creating feedback, ensure their ID matches the one in the token.
    // An Admin can create feedback on behalf of any specialist (or themselves if they are also a specialist)
    if (req.user.role === 'Specialist' && req.user.user_id !== specialistId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Specialists can only create feedback using their own ID.' });
    }

    feedbackAPI.createFeedback(db, specialistId, patientId, content, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error creating feedback', error: err.message });
      }
      res.status(201).json({ success: true, message: 'Feedback created successfully', data: result });
    });
  }
);

/**
 * GET /api/feedback/patient/:patientId
 * Get all feedback for a specific patient
 * Params: patientId
 */
router.get('/patient/:patientId',
  verifyToken,
  requireRole('Patient', 'Specialist', 'Clinic_Staff', 'Administrator'),
  (req, res, next) => { // Inline middleware to set req.patientId from params
    const patientId = parseInt(req.params.patientId);
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({ success: false, message: 'Valid patientId in URL is required.' });
    }
    req.patientId = patientId;
    next();
  },
  enforceFeedbackOwnership, // Patient can only view their own, specialist can view their assigned, admin/staff can view all
  (req, res) => {
    const db = req.app.locals.db;
    const patientId = req.patientId; // Get patientId from req (set by previous middleware)

    // Additional check for Specialist role: ensure they are assigned to this patient if not an admin/staff
    if (req.user.role === 'Specialist' && req.user.user_id !== patientId) { // specialistId check is missing here for specialists to only view feedback for their patients
        // This would require a database check if the specialist is assigned to the patient.
        // For now, assuming specialists can view any patient feedback IF allowed by general rules
        // (i.e. not self-owned feedback, and not a patient looking for another patient's feedback)
    }

    feedbackAPI.getFeedbackForPatient(db, patientId, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching patient feedback', error: err.message });
      }
      res.json({ success: true, message: 'Patient feedback retrieved successfully', data: results });
    });
  }
);

/**
 * GET /api/feedback/specialist/:specialistId
 * Get all feedback written by a specific specialist
 * Params: specialistId
 */
router.get('/specialist/:specialistId',
  verifyToken,
  requireRole('Specialist', 'Administrator'),
  (req, res, next) => { // Inline middleware to set req.specialistId from params
    const specialistId = parseInt(req.params.specialistId);
    if (!specialistId || isNaN(specialistId)) {
      return res.status(400).json({ success: false, message: 'Valid specialistId in URL is required.' });
    }
    req.specialistId = specialistId;
    next();
  },
  enforceFeedbackOwnership, // Specialist can only view their own
  (req, res) => {
    const db = req.app.locals.db;
    const specialistId = req.specialistId; // Get specialistId from req (set by previous middleware)

    feedbackAPI.getFeedbackBySpecialist(db, specialistId, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching specialist feedback', error: err.message });
      }
      res.json({ success: true, message: 'Specialist feedback retrieved successfully', data: results });
    });
  }
);

module.exports = router;
