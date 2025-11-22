// routes/adminRoutes.js
// Author: Krish
// Purpose: Express route handlers for administrator endpoints including
//          user management, report generation, and system statistics

const express = require('express');
const router = express.Router();
const adminAPI = require('../api/adminAPI');
const { verifyToken, requireRole } = require('../middleware/auth'); // Import auth middleware
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

// Middleware to validate admin_id from request - REMOVED

/**
 * GET /api/admin/users
 * Get all users for admin view
 * Accessible only by Administrators.
 */
router.get('/users', verifyToken, requireRole('Administrator'), (req, res) => {
  const db = req.app.locals.db;

  adminAPI.getAllUsers(db, (err, users) => {
    if (err) {
      console.error('Error getting all users:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving all users',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: 'All users retrieved successfully',
      data: users
    });
  });
});

/**
 * POST /api/admin/users/specialist
 * Create new specialist account
 * Body: name, email, password, workingId, specialization, phone (optional), profileImage (optional file)
 * Accessible only by Administrators.
 * Response: { success, message, data }
 */
router.post('/users/specialist', upload.single('profileImage'), verifyToken, requireRole('Administrator'), (req, res) => {
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
    phone: req.body.phone || null,
    profileImage: req.file ? req.file.path.replace(/\\/g, "/") : null
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
 * Body: name, email, password, workingId, department, phone (optional), profileImage (optional file)
 * Accessible only by Administrators.
 * Response: { success, message, data }
 */
router.post('/users/staff', upload.single('profileImage'), verifyToken, requireRole('Administrator'), (req, res) => {
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
    phone: req.body.phone || null,
    profileImage: req.file ? req.file.path.replace(/\\/g, "/") : null
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
 * Accessible only by Administrators.
 * Response: { success, message, data }
 */
router.delete('/users/:id', verifyToken, requireRole('Administrator'), (req, res) => {
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
 * Body: period_type (Monthly/Yearly), period_start, period_end
 * Accessible only by Administrators.
 * Response: { success, message, data }
 */
router.post('/reports/generate', verifyToken, requireRole('Administrator'), (req, res) => {
  const db = req.app.locals.db;
  const adminId = req.user.user_id; // Get admin ID from authenticated user

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

      // --- Step 1: Get all active patients metadata ---
    adminAPI.getAllActivePatientsMeta(db, (err, activePatientsMeta) => {
      if (err) {
        console.error('Error getting all active patients metadata:', err);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving active patient metadata for report'
        });
      }
  
      // --- Step 2: Get reading trends for each patient concurrently ---
      const patientTrendsPromises = activePatientsMeta.map(patient => {
        return new Promise((resolve, reject) => {
          adminAPI.getPatientReadingTrendsForPeriod(db, patient.Patient_ID, period_start, period_end, (trendErr, trends) => {
            if (trendErr) {
              console.error(`Error getting trends for patient ${patient.Patient_ID}:`, trendErr);
              // Resolve with basic patient info and null trends if error, to keep patient in list
              return resolve({
                id: patient.Patient_ID,
                name: patient.Patient_Name,
                email: patient.Patient_Email,
                average_reading: null,
                highest_reading: null,
                lowest_reading: null,
                total_readings: 0
              });
            }
            resolve({
              id: patient.Patient_ID,
              name: patient.Patient_Name,
              email: patient.Patient_Email,
              average_reading: trends.Average_Reading,
              highest_reading: trends.Highest_Reading,
              lowest_reading: trends.Lowest_Reading,
              total_readings: trends.Total_Readings
            });
          });
        });
      });
  
      Promise.all(patientTrendsPromises)
        .then(patientTrendsList => {
          // --- Step 3: Get overall active patients count ---
          adminAPI.getTotalActivePatientsCount(db, (err, totalActivePatientsCount) => {
            if (err) {
              console.error('Error getting total active patients count:', err);
              return res.status(500).json({ success: false, message: 'Error retrieving total active patients count' });
            }
  
            // --- Step 4: Get overall reading statistics for the period ---
            const readingsQuery = `
              SELECT
                COUNT(*) AS total_readings,
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
                  total_active: totalActivePatientsCount, // Overall active patients count
                  list: patientTrendsList // Detailed list with trends for each patient
                },
                readings: {
                  total: stats.total_readings,
                  average: parseFloat(stats.avg_reading || 0).toFixed(2),
                  min: stats.min_reading || 0,
                  max: stats.max_reading || 0,
                  by_category: {
                    normal: stats.normal_count,
                    borderline: stats.borderline_count,
                    abnormal: stats.abnormal_count
                  }
                },
                generated_at: new Date().toISOString()
              };
  
              // Save report
              adminAPI.saveReport(db, adminId, period_type, period_start, period_end, summaryData, (err, result) => {
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
        })
        .catch(error => {
          console.error('Unhandled error in patient trends promises:', error);
          return res.status(500).json({ success: false, message: 'Internal server error during report generation' });
        });
    });});

/**
 * GET /api/admin/reports/:id
 * Retrieve specific report
 * Params: id (report_id)
 * Accessible only by Administrators.
 * Response: { success, message, data }
 */
router.get('/reports/:id', verifyToken, requireRole('Administrator'), (req, res) => {
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
 * Accessible only by Administrators.
 * Response: { success, message, data }
 */
router.get('/stats', verifyToken, requireRole('Administrator'), (req, res) => {
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
