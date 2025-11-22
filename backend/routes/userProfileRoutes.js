// routes/userProfileRoutes.js
// Author: Gemini
// Purpose: Express route handlers for user profile management.

const express = require('express');
const router = express.Router();
const userProfileAPI = require('../api/userProfileAPI');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

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
 * GET /api/user/profile
 * Retrieves the profile of the authenticated user.
 * Accessible by any authenticated user.
 */
router.get('/profile',
  verifyToken,
  (req, res) => {
    const db = req.app.locals.db;
    const userId = req.user.user_id; // User ID from the authenticated token

    userProfileAPI.getUserProfile(db, userId, (err, profile) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error retrieving user profile', error: err.message });
      }
      if (!profile) {
        return res.status(404).json({ success: false, message: 'User profile not found.' });
      }
      res.json({ success: true, message: 'User profile retrieved successfully', data: profile });
    });
  }
);

/**
 * PUT /api/user/profile
 * Updates the profile of the authenticated user including role-specific fields.
 * Accessible by any authenticated user.
 * Body: { "name": "New Name", "phone": "123-456-7890", "profileImage": (file),
 *         Patient: "healthcareNumber", "dateOfBirth",
 *         Specialist: "workingId", "specialization",
 *         Clinic_Staff: "workingId", "department" }
 */
router.put('/profile',
  verifyToken,
  upload.single('profileImage'), // Apply multer middleware
  (req, res) => {
    const db = req.app.locals.db;
    const userId = req.user.user_id; // User ID from the authenticated token
    const userRole = req.user.role; // User role from the authenticated token
    const { name, phone, healthcareNumber, dateOfBirth, workingId, specialization, department } = req.body;

    const updateData = {};

    // Validate and add common fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Name must be a non-empty string.' });
      }
      updateData.name = name.trim();
    }
    if (phone !== undefined) {
      if (phone !== null && (typeof phone !== 'string' || phone.trim().length === 0)) {
        return res.status(400).json({ success: false, message: 'Phone must be a non-empty string or null.' });
      }
      updateData.phone = phone === null ? null : phone.trim();
    }

    // Handle profile image upload
    if (req.file) {
      updateData.profileImage = req.file.path.replace(/\\/g, '/'); // Normalize path
    }

    // Add role-specific fields
    if (userRole === 'Patient') {
      if (healthcareNumber !== undefined) {
        if (typeof healthcareNumber !== 'string' || healthcareNumber.trim().length === 0) {
          return res.status(400).json({ success: false, message: 'Healthcare number must be a non-empty string.' });
        }
        updateData.healthcareNumber = healthcareNumber.trim();
      }
      if (dateOfBirth !== undefined) {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateOfBirth)) {
          return res.status(400).json({ success: false, message: 'Date of birth must be in YYYY-MM-DD format.' });
        }
        updateData.dateOfBirth = dateOfBirth;
      }
    } else if (userRole === 'Specialist') {
      if (workingId !== undefined) {
        if (typeof workingId !== 'string' || workingId.trim().length === 0) {
          return res.status(400).json({ success: false, message: 'Working ID must be a non-empty string.' });
        }
        updateData.workingId = workingId.trim();
      }
      if (specialization !== undefined) {
        if (typeof specialization !== 'string' || specialization.trim().length === 0) {
          return res.status(400).json({ success: false, message: 'Specialization must be a non-empty string.' });
        }
        updateData.specialization = specialization.trim();
      }
    } else if (userRole === 'Clinic_Staff') {
      if (workingId !== undefined) {
        if (typeof workingId !== 'string' || workingId.trim().length === 0) {
          return res.status(400).json({ success: false, message: 'Working ID must be a non-empty string.' });
        }
        updateData.workingId = workingId.trim();
      }
      if (department !== undefined) {
        if (typeof department !== 'string' || department.trim().length === 0) {
          return res.status(400).json({ success: false, message: 'Department must be a non-empty string.' });
        }
        updateData.department = department.trim();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    userProfileAPI.updateUserProfile(db, userId, userRole, updateData, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating user profile', error: err.message });
      }
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      res.json({ success: true, message: 'User profile updated successfully', data: result });
    });
  }
);

module.exports = router;
