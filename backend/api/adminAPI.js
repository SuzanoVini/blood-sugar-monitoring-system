// ===============================================
// File: api/adminAPI.js
// Author: Krish
// Purpose: Provide admin-level functions for user management,
//          system statistics, and report handling.

// 1️ Get all users (admin view)
function getAllUsers(db, callback) {
  const query = `
    SELECT User_ID, Name, Role, Email
    FROM User
    ORDER BY Role, Name;
  `;
  db.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results); // Return all user info for admin view
  });
}

// 2️ Get system statistics
function getSystemStats(db, callback) {
  const stats = {};

  // Query 1: Count all users grouped by role
  const queryUsers = "SELECT Role, COUNT(*) AS count FROM User GROUP BY Role;";

  // Query 2: Count total sugar readings recorded this month
  const queryReadings = `
    SELECT COUNT(*) AS total_readings
    FROM Sugar_Reading
    WHERE MONTH(DateTime) = MONTH(CURRENT_DATE())
      AND YEAR(DateTime) = YEAR(CURRENT_DATE());
  `;

  // Step 1: Get user counts
  db.query(queryUsers, (err, userResults) => {
    if (err) return callback(err);

    userResults.forEach(row => {
      stats[row.Role] = row.count; // e.g., stats['Patient'] = 5
    });

    // Step 2: Get total readings this month
    db.query(queryReadings, (err, readingResults) => {
      if (err) return callback(err);

      stats.total_readings_this_month = readingResults[0].total_readings;
      callback(null, stats); // Return combined stats object
    });
  });
}

// 3️ Get patient list for report generation
function getActivePatientsInPeriod(db, start_date, end_date, callback) {
  const query = `
    SELECT DISTINCT p.Patient_ID, u.Name
    FROM Patient p
    JOIN Sugar_Reading r ON p.Patient_ID = r.Patient_ID
    JOIN User u ON p.Patient_ID = u.User_ID
    WHERE r.DateTime BETWEEN ? AND ?
    ORDER BY u.Name;
  `;

  db.query(query, [start_date, end_date], (err, results) => {
    if (err) return callback(err);
    callback(null, results); // Returns list of patients with readings in given range
  });
}

// 4️ Save generated report
function saveReport(db, admin_id, period_type, period_start, period_end, summary_data, callback) {
  const query = `
    INSERT INTO Report (Admin_ID, Period_Type, Period_Start, Period_End, Summary_Data)
    VALUES (?, ?, ?, ?, ?);
  `;

  const summaryJSON = JSON.stringify(summary_data); // Convert summary data to JSON

  db.query(query, [admin_id, period_type, period_start, period_end, summaryJSON], (err, result) => {
    if (err) return callback(err);
    callback(null, { report_id: result.insertId }); // Return newly created report_ID
  });
}

// Export all admin functions
module.exports = {
  getAllUsers,
  getSystemStats,
  getActivePatientsInPeriod,
  saveReport
};
