// ===============================================
// File: routes/adminRoutes.js
// Author: Manan Chopra
// Purpose: Express routes for admin dashboard operations

const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust path to your DB connection
const adminAPI = require('../api/adminAPI');

// 1️ Get all users
router.get('/getAllUsers', (req, res) => {
  adminAPI.getAllUsers(db, (err, users) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(users);
  });
});

// 2️ Get system statistics
router.get('/getSystemStats', (req, res) => {
  adminAPI.getSystemStats(db, (err, stats) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(stats);
  });
});

// 3️ Create specialist
router.post('/createSpecialist', (req, res) => {
  adminAPI.createSpecialist(db, req.body, (err, result) => {
    if (err) return res.status(400).json({ message: err.message });
    res.json(result);
  });
});

// 4️ Create staff
router.post('/createStaff', (req, res) => {
  adminAPI.createStaff(db, req.body, (err, result) => {
    if (err) return res.status(400).json({ message: err.message });
    res.json(result);
  });
});

// 5️ Delete user
router.delete('/deleteUser/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  adminAPI.deleteUser(db, userId, (err, result) => {
    if (err) return res.status(400).json({ message: err.message });
    res.json(result);
  });
});

// 6️ Generate report
router.post('/generateReport', (req, res) => {
  const { type, start, end } = req.body;
  const adminId = req.user?.id || 1; // Replace with session logic if needed

  // Example summary data (replace with real aggregation logic)
  const summaryData = {
    total_active_patients: 12,
    patient_stats: [
      { name: 'John Doe', avg: 110, max: 140, min: 90 },
      { name: 'Jane Smith', avg: 105, max: 130, min: 85 }
    ],
    top_triggers: ['pasta', 'stress', 'soda']
  };

  adminAPI.saveReport(db, adminId, type, start, end, summaryData, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ ...result, ...summaryData });
  });
});

module.exports = router;