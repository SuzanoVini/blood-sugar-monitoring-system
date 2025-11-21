// routes/reportingRoutes.js
// Author: Gemini
// Purpose: Express route handlers for generating and retrieving system reports.

const express = require('express');
const router = express.Router();
const reportingAPI = require('../api/reportingAPI');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * POST /api/reports/generate
 * Generates a new system report for a specified period.
 * Accessible only by Administrators.
 * Body: { "periodType": "Monthly", "periodStart": "YYYY-MM-DD", "periodEnd": "YYYY-MM-DD" }
 */
router.post('/generate',
  verifyToken,
  requireRole('Administrator'),
  (req, res) => {
    const db = req.app.locals.db;
    const adminId = req.user.user_id; // Get admin ID from authenticated user
    const { periodType, periodStart, periodEnd } = req.body;

    if (!periodType || !['Monthly', 'Yearly'].includes(periodType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing periodType. Must be "Monthly" or "Yearly".' });
    }
    if (!periodStart || !periodEnd || !/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) {
      return res.status(400).json({ success: false, message: 'Missing or invalid periodStart/periodEnd. Format must be YYYY-MM-DD.' });
    }

    reportingAPI.generateReport(db, adminId, periodType, periodStart, periodEnd, (err, report) => {
      if (err) {
        return res.status(500).json({ success: false, message: `Error generating report: ${err.message}` });
      }
      res.status(201).json({ success: true, message: 'Report generated successfully', data: report });
    });
  }
);

/**
 * GET /api/reports
 * Retrieves all previously generated system reports.
 * Accessible only by Administrators.
 */
router.get('/',
  verifyToken,
  requireRole('Administrator'),
  (req, res) => {
    const db = req.app.locals.db;

    reportingAPI.getReports(db, (err, reports) => {
      if (err) {
        return res.status(500).json({ success: false, message: `Error retrieving reports: ${err.message}` });
      }
      res.json({ success: true, message: 'Reports retrieved successfully', data: reports });
    });
  }
);

/**
 * GET /api/reports/:id/summary
 * Retrieves the parsed summary data for a single report.
 * Accessible only by Administrators.
 */
router.get('/:id/summary',
  verifyToken,
  requireRole('Administrator'),
  (req, res) => {
    const db = req.app.locals.db;
    const reportId = parseInt(req.params.id);

    if (!reportId || isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'A valid report ID is required.' });
    }

    reportingAPI.getReportSummary(db, reportId, (err, summary) => {
      if (err) {
        const statusCode = err.message.includes('not found') ? 404 : 500;
        return res.status(statusCode).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: 'Report summary retrieved successfully', data: summary });
    });
  }
);

module.exports = router;
