// routes/userProfileRoutes.js
// Author: Gemini
// Purpose: Express route handlers for user profile management.

const express = require('express');
const router = express.Router();
const userProfileAPI = require('../api/userProfileAPI');
const { verifyToken } = require('../middleware/auth'); // Only verifyToken is needed as users manage their own profile

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
 * Updates the profile of the authenticated user.
 * Accessible by any authenticated user.
 * Body: { "name": "New Name", "phone": "123-456-7890" }
 */
router.put('/profile',
  verifyToken,
  (req, res) => {
    const db = req.app.locals.db;
    const userId = req.user.user_id; // User ID from the authenticated token
    const { name, phone } = req.body;

    const updateData = {};
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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    userProfileAPI.updateUserProfile(db, userId, updateData, (err, result) => {
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
