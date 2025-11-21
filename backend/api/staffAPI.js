// api/staffAPI.js
// Author: Gemini
// Purpose: API functions for clinic staff operations related to patient data.

/**
 * Get details for a specific patient, accessible by staff.
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Function} callback - Callback function(err, patientDetails)
 */
function getStaffPatientDetails(db, patientId, callback) {
  const query = `
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

  db.query(query, [patientId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null); // Patient not found
    callback(null, results[0]);
  });
}

/**
 * Get readings for a specific patient, accessible by staff.
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Object} filters - Optional filters: { startDate, endDate, category, limit, offset }
 * @param {Function} callback - Callback function(err, readings)
 */
function getStaffPatientReadings(db, patientId, filters, callback) {
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
}

/**
 * Get feedback for a specific patient, accessible by staff.
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Function} callback - Callback function(err, feedbackList)
 */
function getStaffPatientFeedback(db, patientId, callback) {
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
  `;

  db.query(query, [patientId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
}


module.exports = {
  getStaffPatientDetails,
  getStaffPatientReadings,
  getStaffPatientFeedback
};
