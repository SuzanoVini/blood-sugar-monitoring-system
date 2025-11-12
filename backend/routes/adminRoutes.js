// routes/adminRoutes.js
// Author: Krish
// Purpose: Express route handlers for administrator endpoints including
//          user management, report generation, and system statistics

const express = require('express');
const router = express.Router();
const adminAPI = require('../api/adminAPI');

// Middleware to validate admin_id from request
function validateAdminId(req, res, next) {
  const adminId = parseInt(req.body.admin_id || req.query.admin_id);

  if (!adminId || isNaN(adminId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid admin_id is required'
    });
  }

  req.adminId = adminId;
  next();
}

// Middleware to verify admin role (interim solution until auth middleware)
function verifyAdminRole(req, res, next) {
  const db = req.app.locals.db;

  const query = 'SELECT Role FROM User WHERE User_ID = ? AND Status = ?';
  db.query(query, [req.adminId, 'Active'], (err, results) => {
    if (err) {
      console.error('Error verifying admin role:', err);
      return res.status(500).json({
        success: false,
        message: 'Error verifying admin role'
      });
    }

    if (results.length === 0 || results[0].Role !== 'Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Administrator role required'
      });
    }

    next();
  });
}

/**
 * POST /api/admin/users/specialist
 * Create new specialist account
 * Body: admin_id (required), name, email, password, workingId, specialization, phone (optional)
 * Response: { success, message, data }
 */
router.post('/users/specialist', validateAdminId, verifyAdminRole, (req, res) => {
  const db = req.app.locals.db;

  // Validate required fields
  const { name, email, password, workingId, specialization } = req.body;

  if (!name || !email || !password || !workingId || !specialization) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, email, password, workingId, specialization'
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

  const userData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    workingId: workingId.trim(),
    specialization: specialization.trim(),
    phone: req.body.phone || null
  };

  adminAPI.createSpecialist(db, userData, (err, result) => {
    if (err) {
      console.error('Error creating specialist:', err);

      if (err.message.includes('Email already registered')) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error creating specialist account'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Specialist account created successfully',
      data: result
    });
  });
});

/**
 * POST /api/admin/users/staff
 * Create new clinic staff account
 * Body: admin_id (required), name, email, password, workingId, department, phone (optional)
 * Response: { success, message, data }
 */
router.post('/users/staff', validateAdminId, verifyAdminRole, (req, res) => {
  const db = req.app.locals.db;

  // Validate required fields
  const { name, email, password, workingId, department } = req.body;

  if (!name || !email || !password || !workingId || !department) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, email, password, workingId, department'
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

  const userData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    workingId: workingId.trim(),
    department: department.trim(),
    phone: req.body.phone || null
  };

  adminAPI.createStaff(db, userData, (err, result) => {
    if (err) {
      console.error('Error creating staff:', err);

      if (err.message.includes('Email already registered')) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error creating staff account'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: result
    });
  });
});

/**
 * DELETE /api/admin/users/:id
 * Delete user account
 * Params: id (user_id)
 * Query: admin_id (required)
 * Response: { success, message, data }
 */
router.delete('/users/:id', validateAdminId, verifyAdminRole, (req, res) => {
  const db = req.app.locals.db;
  const userId = parseInt(req.params.id);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid user ID is required'
    });
  }

  adminAPI.deleteUser(db, userId, (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);

      if (err.message.includes('User not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error deleting user account'
      });
    }

    res.json({
      success: true,
      message: 'User account deleted successfully',
      data: result
    });
  });
});

/**
 * POST /api/admin/reports/generate
 * Generate system report
 * Body: admin_id (required), period_type (Monthly/Yearly), period_start, period_end
 * Response: { success, message, data }
 */
router.post('/reports/generate', validateAdminId, verifyAdminRole, (req, res) => {
  const db = req.app.locals.db;

  // Validate required fields
  const { period_type, period_start, period_end } = req.body;

  if (!period_type || !period_start || !period_end) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: period_type, period_start, period_end'
    });
  }

  // Validate period_type
  if (period_type !== 'Monthly' && period_type !== 'Yearly') {
    return res.status(400).json({
      success: false,
      message: 'period_type must be either "Monthly" or "Yearly"'
    });
  }

  // Validate date formats (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(period_start) || !dateRegex.test(period_end)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  // Get active patients in period
  adminAPI.getActivePatientsInPeriod(db, period_start, period_end, (err, patients) => {
    if (err) {
      console.error('Error getting active patients:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving patient data for report'
      });
    }

    // Get reading statistics for the period
    const readingsQuery = `
      SELECT
        COUNT(*) AS total_readings,
        COUNT(DISTINCT Patient_ID) AS active_patients,
        AVG(Value) AS avg_reading,
        MIN(Value) AS min_reading,
        MAX(Value) AS max_reading,
        SUM(CASE WHEN Category = 'Normal' THEN 1 ELSE 0 END) AS normal_count,
        SUM(CASE WHEN Category = 'Borderline' THEN 1 ELSE 0 END) AS borderline_count,
        SUM(CASE WHEN Category = 'Abnormal' THEN 1 ELSE 0 END) AS abnormal_count
      FROM Sugar_Reading
      WHERE DateTime BETWEEN ? AND ?;
    `;

    db.query(readingsQuery, [period_start, period_end], (err, statsResults) => {
      if (err) {
        console.error('Error getting reading statistics:', err);
        return res.status(500).json({
          success: false,
          message: 'Error calculating report statistics'
        });
      }

      const stats = statsResults[0];

      // Build summary data
      const summaryData = {
        period: {
          type: period_type,
          start: period_start,
          end: period_end
        },
        patients: {
          total_active: stats.active_patients,
          list: patients.map(p => ({ id: p.Patient_ID, name: p.Name }))
        },
        readings: {
          total: stats.total_readings,
          average: parseFloat(stats.avg_reading).toFixed(2),
          min: stats.min_reading,
          max: stats.max_reading,
          by_category: {
            normal: stats.normal_count,
            borderline: stats.borderline_count,
            abnormal: stats.abnormal_count
          }
        },
        generated_at: new Date().toISOString()
      };

      // Save report
      adminAPI.saveReport(db, req.adminId, period_type, period_start, period_end, summaryData, (err, result) => {
        if (err) {
          console.error('Error saving report:', err);
          return res.status(500).json({
            success: false,
            message: 'Error saving generated report'
          });
        }

        res.status(201).json({
          success: true,
          message: 'Report generated successfully',
          data: {
            report_id: result.report_id,
            summary: summaryData
          }
        });
      });
    });
  });
});

/**
 * GET /api/admin/reports/:id
 * Retrieve specific report
 * Params: id (report_id)
 * Query: admin_id (required)
 * Response: { success, message, data }
 */
router.get('/reports/:id', validateAdminId, verifyAdminRole, (req, res) => {
  const db = req.app.locals.db;
  const reportId = parseInt(req.params.id);

  if (!reportId || isNaN(reportId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid report ID is required'
    });
  }

  adminAPI.getReportById(db, reportId, (err, report) => {
    if (err) {
      console.error('Error getting report:', err);

      if (err.message.includes('Report not found')) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error retrieving report'
      });
    }

    res.json({
      success: true,
      message: 'Report retrieved successfully',
      data: report
    });
  });
});

/**
 * GET /api/admin/stats
 * Get system-wide statistics
 * Query: admin_id (required)
 * Response: { success, message, data }
 */
router.get('/stats', validateAdminId, verifyAdminRole, (req, res) => {
  const db = req.app.locals.db;

  adminAPI.getSystemStats(db, (err, stats) => {
    if (err) {
      console.error('Error getting system stats:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving system statistics'
      });
    }

    res.json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: stats
    });
  });
});

module.exports = router;
