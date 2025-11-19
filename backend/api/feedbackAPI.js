// api/feedbackAPI.js
// Author: Gemini
// Purpose: API functions for managing feedback between specialists and patients

/**
 * Creates a new feedback entry from a specialist to a patient.
 * @param {Object} db - Database connection
 * @param {number} specialistId - The ID of the specialist giving feedback
 * @param {number} patientId - The ID of the patient receiving feedback
 * @param {string} content - The text content of the feedback
 * @param {Function} callback - Callback function(err, result)
 */
function createFeedback(db, specialistId, patientId, content, callback) {
  const query = `
    INSERT INTO Feedback (Specialist_ID, Patient_ID, Content, Created_At)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(query, [specialistId, patientId, content], (err, results) => {
    if (err) {
      console.error('Error creating feedback:', err);
      return callback(err, null);
    }

    const newFeedback = {
      feedback_id: results.insertId,
      specialist_id: specialistId,
      patient_id: patientId,
      content: content,
      created_at: new Date()
    };
    
    console.log(`New feedback created from Specialist ${specialistId} to Patient ${patientId}`);
    callback(null, newFeedback);
  });
}

/**
 * Retrieves all feedback received by a specific patient.
 * @param {Object} db - Database connection
 * @param {number} patientId - The ID of the patient
 * @param {Function} callback - Callback function(err, results)
 */
function getFeedbackForPatient(db, patientId, callback) {
  const query = `
    SELECT
      f.Feedback_ID,
      f.Specialist_ID,
      u.Name AS Specialist_Name,
      f.Content,
      f.Created_At
    FROM Feedback f
    JOIN User u ON f.Specialist_ID = u.User_ID
    WHERE f.Patient_ID = ?
    ORDER BY f.Created_At DESC
  `;

  db.query(query, [patientId], (err, results) => {
    if (err) {
      console.error(`Error fetching feedback for patient ${patientId}:`, err);
      return callback(err, null);
    }
    callback(null, results);
  });
}

/**
 * Retrieves all feedback written by a specific specialist.
 * @param {Object} db - Database connection
 * @param {number} specialistId - The ID of the specialist
 * @param {Function} callback - Callback function(err, results)
 */
function getFeedbackBySpecialist(db, specialistId, callback) {
  const query = `
    SELECT
      f.Feedback_ID,
      f.Patient_ID,
      u.Name AS Patient_Name,
      f.Content,
      f.Created_At
    FROM Feedback f
    JOIN User u ON f.Patient_ID = u.User_ID
    WHERE f.Specialist_ID = ?
    ORDER BY f.Created_At DESC
  `;

  db.query(query, [specialistId], (err, results) => {
    if (err) {
      console.error(`Error fetching feedback by specialist ${specialistId}:`, err);
      return callback(err, null);
    }
    callback(null, results);
  });
}

module.exports = {
  createFeedback,
  getFeedbackForPatient,
  getFeedbackBySpecialist
};
