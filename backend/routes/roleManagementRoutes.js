// routes/roleManagementRoutes.js
// Author: Gemini
// Purpose: Express route handlers for managing user roles.

const express = require('express');
const router = express.Router();
const roleManagementAPI = require('../api/roleManagementAPI');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/roles
 * Retrieves a list of all available roles in the system.
 * Accessible only by Administrators.
 */
router.get('/',
  verifyToken,
  requireRole('Administrator'),
  (req, res) => {
    const db = req.app.locals.db;

    roleManagementAPI.getAllRoles(db, (err, roles) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error retrieving roles', error: err.message });
      }
      res.json({ success: true, message: 'Roles retrieved successfully', data: roles });
    });
  }
);

/**
 * PUT /api/roles/user/:userId
 * Updates the role for a specific user.
 * Accessible only by Administrators.
 * Body: { "newRole": "Specialist" }
 */
router.put('/user/:userId',
  verifyToken,
  requireRole('Administrator'),
  (req, res) => {
    const db = req.app.locals.db;
    const userId = parseInt(req.params.userId);
    const { newRole } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'A valid user ID is required in the URL.' });
    }

    if (!newRole || typeof newRole !== 'string' || newRole.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'The "newRole" field is required in the request body.' });
    }

    roleManagementAPI.updateUserRole(db, userId, newRole, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: `Error updating user role: ${err.message}` });
      }

      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }

      res.json({ success: true, message: 'User role updated successfully', data: result });
    });
  }
);

module.exports = router;
