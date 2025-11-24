// ===============================================
// File: api/adminAPI.js
// Author: Krish
// Purpose: Provide admin-level functions for user management,
//          system statistics, and report handling.

// 1) Get all users (admin view)
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

// 2) Get system statistics
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

// 3) Get all active patients with their basic metadata
function getAllActivePatientsMeta(db, callback) {
  const query = `
    SELECT
      User_ID AS Patient_ID,
      Name AS Patient_Name,
      Email AS Patient_Email
    FROM User
    WHERE Role = 'Patient';
  `;
  db.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results); // Returns list of all active patients with their name and email
  });
}

// Helper function to get reading trends for a single patient within a period
function getPatientReadingTrendsForPeriod(db, patientId, start_date, end_date, callback) {
  const query = `
    SELECT
      COALESCE(AVG(sr.Value), 0) AS Average_Reading,
      COALESCE(MAX(sr.Value), 0) AS Highest_Reading,
      COALESCE(MIN(sr.Value), 0) AS Lowest_Reading,
      COUNT(sr.Reading_ID) AS Total_Readings
    FROM Sugar_Reading sr
    WHERE sr.Patient_ID = ? AND sr.DateTime BETWEEN ? AND ?;
  `;
  db.query(query, [patientId, start_date, end_date], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]); // Returns trend data for a single patient
  });
}

// Helper function to get the total count of active patients
function getTotalActivePatientsCount(db, callback) {
  const query = `
    SELECT COUNT(*) AS total_active_patients
    FROM User
    WHERE Role = 'Patient' AND Status = 'Active';
  `;
  db.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].total_active_patients);
  });
}

// 4) Save generated report
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

// 5) Create specialist account
function createSpecialist(db, userData, callback) {
  const bcrypt = require('bcrypt');
  const SALT_ROUNDS = 10;

  // Validate required fields
  if (!userData.name || !userData.email || !userData.password || !userData.workingId || !userData.specialization) {
    return callback(new Error('Missing required fields: name, email, password, workingId, specialization'), null);
  }

  // Hash password
  bcrypt.hash(userData.password, SALT_ROUNDS, (err, passwordHash) => {
    if (err) {
      return callback(err, null);
    }

    // Step 1: Insert into User table
    const userQuery = `
      INSERT INTO User (Name, Email, Password_Hash, Phone, Role, Status, Profile_Image)
      VALUES (?, ?, ?, ?, 'Specialist', 'Active', ?);
    `;

    const userValues = [
      userData.name,
      userData.email,
      passwordHash,
      userData.phone || null,
      userData.profileImage || null
    ];

    db.query(userQuery, userValues, (err, userResult) => {
      if (err) {
        // Check for duplicate email
        if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Email')) {
          return callback(new Error('Email already registered'), null);
        }
        return callback(err, null);
      }

      const userId = userResult.insertId;

      // Step 2: Insert into Specialist table
      const specialistQuery = `
        INSERT INTO Specialist (Specialist_ID, Working_ID, Specialization)
        VALUES (?, ?, ?);
      `;

      const specialistValues = [userId, userData.workingId, userData.specialization];

      db.query(specialistQuery, specialistValues, (err, specialistResult) => {
        if (err) {
          // Rollback: Delete the user record if specialist insertion fails
          db.query('DELETE FROM User WHERE User_ID = ?', [userId], (deleteErr) => {
            if (deleteErr) {
              console.error('Error rolling back user creation:', deleteErr);
            }
          });
          return callback(err, null);
        }

        callback(null, {
          userId: userId,
          name: userData.name,
          email: userData.email,
          role: 'Specialist',
          workingId: userData.workingId,
          specialization: userData.specialization
        });
      });
    });
  });
}

// 6) Create clinic staff account
function createStaff(db, userData, callback) {
  const bcrypt = require('bcrypt');
  const SALT_ROUNDS = 10;

  // Validate required fields
  if (!userData.name || !userData.email || !userData.password || !userData.workingId || !userData.department) {
    return callback(new Error('Missing required fields: name, email, password, workingId, department'), null);
  }

  // Hash password
  bcrypt.hash(userData.password, SALT_ROUNDS, (err, passwordHash) => {
    if (err) {
      return callback(err, null);
    }

    // Step 1: Insert into User table
    const userQuery = `
      INSERT INTO User (Name, Email, Password_Hash, Phone, Role, Status, Profile_Image)
      VALUES (?, ?, ?, ?, 'Clinic_Staff', 'Active', ?);
    `;

    const userValues = [
      userData.name,
      userData.email,
      passwordHash,
      userData.phone || null,
      userData.profileImage || null
    ];

    db.query(userQuery, userValues, (err, userResult) => {
      if (err) {
        // Check for duplicate email
        if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Email')) {
          return callback(new Error('Email already registered'), null);
        }
        return callback(err, null);
      }

      const userId = userResult.insertId;

      // Step 2: Insert into Clinic_Staff table
      const staffQuery = `
        INSERT INTO Clinic_Staff (Staff_ID, Working_ID, Department)
        VALUES (?, ?, ?);
      `;

      const staffValues = [userId, userData.workingId, userData.department];

      db.query(staffQuery, staffValues, (err, staffResult) => {
        if (err) {
          // Rollback: Delete the user record if staff insertion fails
          db.query('DELETE FROM User WHERE User_ID = ?', [userId], (deleteErr) => {
            if (deleteErr) {
              console.error('Error rolling back user creation:', deleteErr);
            }
          });
          return callback(err, null);
        }

        callback(null, {
          userId: userId,
          name: userData.name,
          email: userData.email,
          role: 'Clinic_Staff',
          workingId: userData.workingId,
          department: userData.department
        });
      });
    });
  });
}

// 7) Delete user account
function deleteUser(db, userId, callback) {
  // Validate userId
  if (!userId || isNaN(userId)) {
    return callback(new Error('Valid userId is required'), null);
  }

  // Step 1: Verify user exists
  const checkQuery = 'SELECT User_ID, Name, Role FROM User WHERE User_ID = ?';

  db.query(checkQuery, [userId], (err, results) => {
    if (err) {
      return callback(err, null);
    }

    if (results.length === 0) {
      return callback(new Error('User not found'), null);
    }

    const user = results[0];

    // Step 2: Delete user (CASCADE will handle related records)
    const deleteQuery = 'DELETE FROM User WHERE User_ID = ?';

    db.query(deleteQuery, [userId], (err, result) => {
      if (err) {
        return callback(err, null);
      }

      callback(null, {
        userId: user.User_ID,
        name: user.Name,
        role: user.Role,
        deleted: true
      });
    });
  });
}

// 8) Get report by ID
function getReportById(db, reportId, callback) {
  // Validate reportId
  if (!reportId || isNaN(reportId)) {
    return callback(new Error('Valid reportId is required'), null);
  }

  const query = `
    SELECT r.Report_ID, r.Admin_ID, r.Period_Type, r.Period_Start, r.Period_End,
           r.Generated_At, r.Summary_Data, u.Name AS Admin_Name
    FROM Report r
    JOIN Administrator a ON r.Admin_ID = a.Admin_ID
    JOIN User u ON a.Admin_ID = u.User_ID
    WHERE r.Report_ID = ?;
  `;

  db.query(query, [reportId], (err, results) => {
    if (err) {
      return callback(err, null);
    }

    if (results.length === 0) {
      return callback(new Error('Report not found'), null);
    }

    const report = results[0];

    // Parse Summary_Data JSON
    try {
      report.Summary_Data = JSON.parse(report.Summary_Data);
    } catch (parseErr) {
      console.error('Error parsing Summary_Data JSON:', parseErr);
      report.Summary_Data = null;
    }

    callback(null, report);
  });
}

// 9) Get all active specialists (for assignment dropdowns)
function getActiveSpecialists(db, callback) {
  const query = `
    SELECT u.User_ID AS Specialist_ID, u.Name, u.Email
    FROM Specialist s
    INNER JOIN User u ON s.Specialist_ID = u.User_ID
    WHERE u.Status = 'Active'
    ORDER BY u.Name;
  `;
  db.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

// 10) Get patient roster with current assignments
function getPatientAssignments(db, callback) {
  const query = `
    SELECT
      p.Patient_ID,
      u.Name AS Patient_Name,
      u.Email AS Patient_Email,
      spa.Assignment_ID,
      spa.Specialist_ID,
      su.Name AS Specialist_Name,
      su.Email AS Specialist_Email,
      spa.Assigned_At
    FROM Patient p
    INNER JOIN User u ON p.Patient_ID = u.User_ID
    LEFT JOIN Specialist_Patient_Assignment spa ON spa.Patient_ID = p.Patient_ID
    LEFT JOIN User su ON spa.Specialist_ID = su.User_ID
    ORDER BY u.Name ASC;
  `;
  db.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

// 11) Assign (or reassign) a specialist to a patient
function assignSpecialistToPatient(db, specialistId, patientId, callback) {
  if (!specialistId || !patientId) {
    return callback(new Error('Valid specialistId and patientId are required'), null);
  }

  // Validate specialist is active
  const specialistQuery = `
    SELECT u.User_ID, u.Status
    FROM Specialist s
    INNER JOIN User u ON s.Specialist_ID = u.User_ID
    WHERE s.Specialist_ID = ?;
  `;

  db.query(specialistQuery, [specialistId], (specErr, specResults) => {
    if (specErr) return callback(specErr, null);
    if (specResults.length === 0) {
      return callback(new Error('Specialist not found'), null);
    }
    if (specResults[0].Status !== 'Active') {
      return callback(new Error('Specialist account is not active'), null);
    }

    // Validate patient exists
    const patientQuery = `
      SELECT u.User_ID, u.Status
      FROM Patient p
      INNER JOIN User u ON p.Patient_ID = u.User_ID
      WHERE p.Patient_ID = ?;
    `;

    db.query(patientQuery, [patientId], (patErr, patResults) => {
      if (patErr) return callback(patErr, null);
      if (patResults.length === 0) {
        return callback(new Error('Patient not found'), null);
      }
      if (patResults[0].Status !== 'Active') {
        return callback(new Error('Patient account is not active'), null);
      }

      // Upsert assignment: if exists, update; else insert
      const checkQuery = `
        SELECT Assignment_ID
        FROM Specialist_Patient_Assignment
        WHERE Patient_ID = ?
        LIMIT 1;
      `;
      db.query(checkQuery, [patientId], (checkErr, checkResults) => {
        if (checkErr) return callback(checkErr, null);

        if (checkResults.length > 0) {
          const assignmentId = checkResults[0].Assignment_ID;
          const updateQuery = `
            UPDATE Specialist_Patient_Assignment
            SET Specialist_ID = ?, Assigned_At = NOW()
            WHERE Assignment_ID = ?;
          `;
          db.query(updateQuery, [specialistId, assignmentId], (updateErr) => {
            if (updateErr) return callback(updateErr, null);
            callback(null, { assignment_id: assignmentId, specialist_id: specialistId, patient_id: patientId, action: 'updated' });
          });
        } else {
          const insertQuery = `
            INSERT INTO Specialist_Patient_Assignment (Specialist_ID, Patient_ID, Assigned_At)
            VALUES (?, ?, NOW());
          `;
          db.query(insertQuery, [specialistId, patientId], (insertErr, insertResult) => {
            if (insertErr) return callback(insertErr, null);
            callback(null, { assignment_id: insertResult.insertId, specialist_id: specialistId, patient_id: patientId, action: 'created' });
          });
        }
      });
    });
  });
}

// 12) Remove specialist assignment from a patient
function unassignSpecialistFromPatient(db, patientId, callback) {
  if (!patientId) return callback(new Error('Valid patientId is required'), null);

  const deleteQuery = `
    DELETE FROM Specialist_Patient_Assignment
    WHERE Patient_ID = ?;
  `;

  db.query(deleteQuery, [patientId], (err, result) => {
    if (err) return callback(err, null);
    callback(null, { patient_id: patientId, removed: result.affectedRows > 0 });
  });
}

// Export all admin functions
module.exports = {
  getAllUsers,
  getSystemStats,
  getAllActivePatientsMeta,
  getPatientReadingTrendsForPeriod,
  getTotalActivePatientsCount,
  saveReport,
  createSpecialist,
  createStaff,
  deleteUser,
  getReportById,
  getActiveSpecialists,
  getPatientAssignments,
  assignSpecialistToPatient,
  unassignSpecialistFromPatient
};
