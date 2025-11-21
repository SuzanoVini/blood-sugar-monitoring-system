// api/specialistAPI.js
// Author: Vinicius Suzano
// Purpose: API functions for specialist operations including viewing assigned patients,
//          providing feedback, and accessing patient data

/**
 * Get all patients assigned to a specialist
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {Function} callback - Callback function(err, patients)
 */
function getAssignedPatients(db, specialistId, callback) {
  console.log('DEBUG: Fetching assigned patients for specialistId:', specialistId); // Debugging line
  const query = `
    SELECT
      p.Patient_ID,
      u.Name,
      u.Email,
      u.Phone,
      u.Status,
      p.Healthcare_Number,
      p.Date_Of_Birth,
      p.Threshold_Normal_Low,
      p.Threshold_Normal_High,
      spa.Assigned_At,
      (SELECT COUNT(*) FROM Sugar_Reading sr WHERE sr.Patient_ID = p.Patient_ID) as total_readings,
      (SELECT COUNT(*) FROM Sugar_Reading sr WHERE sr.Patient_ID = p.Patient_ID AND sr.Category = 'Abnormal') as abnormal_readings,
      (SELECT sr.DateTime FROM Sugar_Reading sr WHERE sr.Patient_ID = p.Patient_ID ORDER BY sr.DateTime DESC LIMIT 1) as last_reading_date
    FROM Specialist_Patient_Assignment spa
    INNER JOIN Patient p ON spa.Patient_ID = p.Patient_ID
    INNER JOIN User u ON p.Patient_ID = u.User_ID
    WHERE spa.Specialist_ID = ?
    ORDER BY u.Name ASC
  `;

  db.query(query, [specialistId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
}

/**
 * Get detailed information about a specific patient
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID (for verification)
 * @param {number} patientId - Patient ID
 * @param {Function} callback - Callback function(err, patientDetails)
 */
function getPatientDetails(db, specialistId, patientId, callback) {
  // First verify the specialist is assigned to this patient
  verifyAssignment(db, specialistId, patientId, (err, isAssigned) => {
    if (err) return callback(err, null);

    if (!isAssigned) {
      return callback(new Error('Specialist is not assigned to this patient'), null);
    }

    // Get patient basic info
    const patientQuery = `
      SELECT
        p.Patient_ID,
        u.Name,
        u.Email,
        u.Phone,
        u.Profile_Image,
        u.Status,
        u.Created_At,
        p.Healthcare_Number,
        p.Date_Of_Birth,
        p.Threshold_Normal_Low,
        p.Threshold_Normal_High
      FROM Patient p
      INNER JOIN User u ON p.Patient_ID = u.User_ID
      WHERE p.Patient_ID = ?
    `;

    db.query(patientQuery, [patientId], (err, patientResults) => {
      if (err) return callback(err, null);

      if (patientResults.length === 0) {
        return callback(new Error('Patient not found'), null);
      }

      const patientInfo = patientResults[0];

      // Get reading statistics
      const statsQuery = `
        SELECT
          COUNT(*) as total_readings,
          AVG(Value) as average_value,
          MIN(Value) as min_value,
          MAX(Value) as max_value,
          SUM(CASE WHEN Category = 'Normal' THEN 1 ELSE 0 END) as normal_count,
          SUM(CASE WHEN Category = 'Borderline' THEN 1 ELSE 0 END) as borderline_count,
          SUM(CASE WHEN Category = 'Abnormal' THEN 1 ELSE 0 END) as abnormal_count,
          MAX(DateTime) as last_reading_date
        FROM Sugar_Reading
        WHERE Patient_ID = ?
      `;

      db.query(statsQuery, [patientId], (err, statsResults) => {
        if (err) return callback(err, null);

        // Get recent readings (last 10)
        const readingsQuery = `
          SELECT
            Reading_ID,
            DateTime,
            Value,
            Unit,
            Category,
            Food_Notes,
            Activity_Notes,
            Event,
            Symptoms,
            Notes
          FROM Sugar_Reading
          WHERE Patient_ID = ?
          ORDER BY DateTime DESC
          LIMIT 10
        `;

        db.query(readingsQuery, [patientId], (err, readingsResults) => {
          if (err) return callback(err, null);

          // Get recent alerts
          const alertsQuery = `
            SELECT
              Alert_ID,
              Week_Start,
              Abnormal_Count,
              Sent_At,
              Recipients
            FROM Alert
            WHERE Patient_ID = ?
            ORDER BY Sent_At DESC
            LIMIT 5
          `;

          db.query(alertsQuery, [patientId], (err, alertsResults) => {
            if (err) return callback(err, null);

            // Combine all data
            const patientDetails = {
              patient_info: patientInfo,
              statistics: statsResults[0],
              recent_readings: readingsResults,
              recent_alerts: alertsResults
            };

            callback(null, patientDetails);
          });
        });
      });
    });
  });
}

/**
 * Get patient's reading history with filtering options
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID (for verification)
 * @param {number} patientId - Patient ID
 * @param {Object} filters - Optional filters: { startDate, endDate, category, limit, offset }
 * @param {Function} callback - Callback function(err, readings)
 */
function getPatientReadingHistory(db, specialistId, patientId, filters, callback) {
  // First verify the specialist is assigned to this patient
  verifyAssignment(db, specialistId, patientId, (err, isAssigned) => {
    if (err) return callback(err, null);

    if (!isAssigned) {
      return callback(new Error('Specialist is not assigned to this patient'), null);
    }

    let query = `
      SELECT
        Reading_ID,
        Patient_ID,
        DateTime,
        Value,
        Unit,
        Food_Notes,
        Activity_Notes,
        Event,
        Symptoms,
        Notes,
        Category
      FROM Sugar_Reading
      WHERE Patient_ID = ?
    `;

    const queryParams = [patientId];

    if (filters.startDate) {
      query += ' AND DateTime >= ?';
      queryParams.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND DateTime <= ?';
      queryParams.push(filters.endDate);
    }

    if (filters.category) {
      query += ' AND Category = ?';
      queryParams.push(filters.category);
    }

    query += ' ORDER BY DateTime DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      queryParams.push(parseInt(filters.limit));

      if (filters.offset) {
        query += ' OFFSET ?';
        queryParams.push(parseInt(filters.offset));
      }
    }

    db.query(query, queryParams, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  });
}

/**
 * Create feedback for a patient
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {number} patientId - Patient ID
 * @param {string} content - Feedback content
 * @param {Function} callback - Callback function(err, feedback)
 */
function createFeedback(db, specialistId, patientId, content, callback) {
  // First verify the specialist is assigned to this patient
  verifyAssignment(db, specialistId, patientId, (err, isAssigned) => {
    if (err) return callback(err, null);

    if (!isAssigned) {
      return callback(new Error('Specialist is not assigned to this patient'), null);
    }

    const query = `
      INSERT INTO Feedback (Specialist_ID, Patient_ID, Content, Created_At)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(query, [specialistId, patientId, content], (err, results) => {
      if (err) return callback(err, null);

      const feedback = {
        feedback_id: results.insertId,
        specialist_id: specialistId,
        patient_id: patientId,
        content: content,
        created_at: new Date()
      };

      console.log(`Feedback created - ID: ${feedback.feedback_id}, Specialist: ${specialistId}, Patient: ${patientId}`);
      callback(null, feedback);
    });
  });
}

/**
 * Get feedback history for a specific patient
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID (for verification)
 * @param {number} patientId - Patient ID
 * @param {number} limit - Maximum number of feedback entries to retrieve
 * @param {Function} callback - Callback function(err, feedbackList)
 */
function getPatientFeedbackHistory(db, specialistId, patientId, limit, callback) {
  // First verify the specialist is assigned to this patient
  verifyAssignment(db, specialistId, patientId, (err, isAssigned) => {
    if (err) return callback(err, null);

    if (!isAssigned) {
      return callback(new Error('Specialist is not assigned to this patient'), null);
    }

    const query = `
      SELECT
        f.Feedback_ID,
        f.Specialist_ID,
        f.Patient_ID,
        f.Content,
        f.Created_At,
        u.Name as Specialist_Name
      FROM Feedback f
      INNER JOIN Specialist s ON f.Specialist_ID = s.Specialist_ID
      INNER JOIN User u ON s.Specialist_ID = u.User_ID
      WHERE f.Patient_ID = ?
      ORDER BY f.Created_At DESC
      LIMIT ?
    `;

    db.query(query, [patientId, limit || 10], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  });
}

/**
 * Get all feedback created by a specific specialist
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {number} limit - Maximum number of feedback entries to retrieve
 * @param {Function} callback - Callback function(err, feedbackList)
 */
function getSpecialistFeedbackHistory(db, specialistId, limit, callback) {
  const query = `
    SELECT
      f.Feedback_ID,
      f.Specialist_ID,
      f.Patient_ID,
      f.Content,
      f.Created_At,
      u.Name as Patient_Name
    FROM Feedback f
    INNER JOIN Patient p ON f.Patient_ID = p.Patient_ID
    INNER JOIN User u ON p.Patient_ID = u.User_ID
    WHERE f.Specialist_ID = ?
    ORDER BY f.Created_At DESC
    LIMIT ?
  `;

  db.query(query, [specialistId, limit || 20], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
}

/**
 * Verify if a specialist is assigned to a patient
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {number} patientId - Patient ID
 * @param {Function} callback - Callback function(err, isAssigned)
 */
function verifyAssignment(db, specialistId, patientId, callback) {
  const query = `
    SELECT Assignment_ID
    FROM Specialist_Patient_Assignment
    WHERE Specialist_ID = ? AND Patient_ID = ?
    LIMIT 1
  `;

  db.query(query, [specialistId, patientId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results.length > 0);
  });
}

/**
 * Verify specialist exists and is active
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {Function} callback - Callback function(err, isValid)
 */
function verifySpecialist(db, specialistId, callback) {
  const query = `
    SELECT u.User_ID, u.Status, u.Role, s.Specialization
    FROM User u
    INNER JOIN Specialist s ON u.User_ID = s.Specialist_ID
    WHERE s.Specialist_ID = ?
  `;

  db.query(query, [specialistId], (err, results) => {
    if (err) return callback(err, null);

    if (results.length === 0) {
      return callback(null, { valid: false, message: 'Specialist not found' });
    }

    const user = results[0];

    if (user.Role !== 'Specialist') {
      return callback(null, { valid: false, message: 'User is not a specialist' });
    }

    if (user.Status !== 'Active') {
      return callback(null, { valid: false, message: 'Specialist account is not active' });
    }

    callback(null, { valid: true, message: 'Specialist is valid', specialization: user.Specialization });
  });
}

/**
 * Get patient alerts visible to specialist
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {number} patientId - Patient ID
 * @param {number} limit - Maximum number of alerts to retrieve
 * @param {Function} callback - Callback function(err, alerts)
 */
function getPatientAlerts(db, specialistId, patientId, limit, callback) {
  // First verify the specialist is assigned to this patient
  verifyAssignment(db, specialistId, patientId, (err, isAssigned) => {
    if (err) return callback(err, null);

    if (!isAssigned) {
      return callback(new Error('Specialist is not assigned to this patient'), null);
    }

    const query = `
      SELECT
        Alert_ID,
        Patient_ID,
        Week_Start,
        Abnormal_Count,
        Sent_At,
        Recipients
      FROM Alert
      WHERE Patient_ID = ?
      ORDER BY Sent_At DESC
      LIMIT ?
    `;

    db.query(query, [patientId, limit || 10], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  });
}

function getSpecialistDashboardStats(db, specialistId, callback) {
  const query = `
    SELECT
      COUNT(DISTINCT spa.Patient_ID) as total_patients,
      (SELECT COUNT(*) FROM Alert a
       INNER JOIN Specialist_Patient_Assignment spa2 ON a.Patient_ID = spa2.Patient_ID
       WHERE spa2.Specialist_ID = ?
       AND a.Sent_At >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as recent_alerts,
      (SELECT COUNT(*) FROM Feedback f WHERE f.Specialist_ID = ?) as total_feedback_given,
      (SELECT COUNT(*) FROM Sugar_Reading sr
       INNER JOIN Specialist_Patient_Assignment spa3 ON sr.Patient_ID = spa3.Patient_ID
       WHERE spa3.Specialist_ID = ?
       AND sr.Category = 'Abnormal'
       AND sr.DateTime >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as abnormal_readings_this_week
    FROM Specialist_Patient_Assignment spa
    WHERE spa.Specialist_ID = ?
  `;

  db.query(query, [specialistId, specialistId, specialistId, specialistId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0]);
  });
}

/**
 * Get readings for all patients assigned to a specialist, with filtering
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {Object} filters - Optional filters: { startDate, endDate, category, patientName }
 * @param {Function} callback - Callback function(err, readings)
 */
function getReadingsForSpecialist(db, specialistId, filters, callback) {
  let query = `
    SELECT
      sr.Reading_ID,
      sr.Patient_ID,
      sr.DateTime,
      sr.Value,
      sr.Unit,
      sr.Category,
      sr.Food_Notes,
      sr.Activity_Notes,
      sr.Notes,
      sr.Symptoms,
      u.Name as patient_name
    FROM Sugar_Reading sr
    JOIN Specialist_Patient_Assignment spa ON sr.Patient_ID = spa.Patient_ID
    JOIN User u ON sr.Patient_ID = u.User_ID
    WHERE spa.Specialist_ID = ?
  `;

  const queryParams = [specialistId];

  if (filters.startDate) {
    query += ' AND sr.DateTime >= ?';
    queryParams.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND sr.DateTime <= ?';
    queryParams.push(filters.endDate);
  }
  if (filters.category) {
    query += ' AND sr.Category = ?';
    queryParams.push(filters.category);
  }
  if (filters.patientName) {
    query += ' AND u.Name LIKE ?';
    queryParams.push(`%${filters.patientName}%`);
  }

  query += ' ORDER BY sr.DateTime DESC';

  db.query(query, queryParams, (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
}

module.exports = {
  getAssignedPatients,
  getPatientDetails,
  getPatientReadingHistory,
  createFeedback,
  getPatientFeedbackHistory,
  getSpecialistFeedbackHistory,
  verifyAssignment,
  verifySpecialist,
  getPatientAlerts,
  getSpecialistDashboardStats,
  getReadingsForSpecialist
};
