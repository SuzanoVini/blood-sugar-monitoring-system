// bloodSugarAPI.js

const db = require('./db'); // MySQL connection pool
const { getEffectiveThresholds, categorizeReading } = require('./utils'); // Utility functions for thresholds and categorization

// BLOOD SUGAR READING FUNCTIONS
// 1. Add a new blood sugar reading for a patient
async function addReading(patient_id, datetime, value, unit, food_notes, activity_notes, event, symptoms, notes) {
  if (value <= 0 || new Date(datetime) > new Date()) throw new Error('Invalid reading value or future datetime');

  const thresholds = await getEffectiveThresholds(patient_id); // Get personalized or default thresholds
  const category = categorizeReading(value, thresholds); // Determine category: Normal, Borderline, Abnormal

  const [result] = await db.query(
    `INSERT INTO Sugar_Reading (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patient_id, datetime, value, unit, food_notes, activity_notes, event, symptoms, notes, category]
  );

  return result.insertId; // Return the new reading ID
}

// 2. Get all readings for a patient (latest first)
async function getReadingsByPatient(patient_id) {
  const [rows] = await db.query(
    `SELECT * FROM Sugar_Reading WHERE Patient_ID = ? ORDER BY DateTime DESC`,
    [patient_id]
  );
  return rows;
}

// 3. Get readings within a specific date range
async function getReadingsByDateRange(patient_id, start_date, end_date) {
  const [rows] = await db.query(
    `SELECT * FROM Sugar_Reading WHERE Patient_ID = ? AND DateTime BETWEEN ? AND ? ORDER BY DateTime DESC`,
    [patient_id, start_date, end_date]
  );
  return rows;
}

// 4. Update an existing reading (recalculate category if value changes)
async function updateReading(reading_id, updates) {
  const fields = [];
  const values = [];

  for (const key in updates) {
    if (key === 'value') {
      const thresholds = await getEffectiveThresholds(updates.patient_id);
      updates.category = categorizeReading(updates.value, thresholds);
    }
    fields.push(`${key} = ?`);
    values.push(updates[key]);
  }

  values.push(reading_id);
  await db.query(`UPDATE Sugar_Reading SET ${fields.join(', ')} WHERE Reading_ID = ?`, values);
}

// 5. Delete a reading by ID
async function deleteReading(reading_id) {
  await db.query(`DELETE FROM Sugar_Reading WHERE Reading_ID = ?`, [reading_id]);
}

// PATIENT & SPECIALIST FUNCTIONS
// 6. Get basic info for all patients (for staff/specialist view)
async function getAllPatients() {
  const [rows] = await db.query(
    `SELECT Patient_ID, Name, Healthcare_Number, Email FROM Patient JOIN User ON Patient.Patient_ID = User.User_ID`
  );
  return rows;
}

// 7. Search patients by name (partial match)
async function searchPatients(search_term) {
  const [rows] = await db.query(
    `SELECT Patient_ID, Name, Healthcare_Number, Email FROM Patient JOIN User ON Patient.Patient_ID = User.User_ID WHERE Name LIKE ?`,
    [`%${search_term}%`]
  );
  return rows;
}

// 8. Add feedback from specialist to patient
async function addFeedback(specialist_id, patient_id, content) {
  await db.query(
    `INSERT INTO Feedback (Specialist_ID, Patient_ID, Content, Created_At) VALUES (?, ?, ?, NOW())`,
    [specialist_id, patient_id, content]
  );
}

// 9. Get feedback history for a patient
async function getFeedbackByPatient(patient_id) {
  const [rows] = await db.query(
    `SELECT F.Content, F.Created_At, U.Name AS Specialist_Name
     FROM Feedback F
     JOIN Specialist S ON F.Specialist_ID = S.Specialist_ID
     JOIN User U ON S.Specialist_ID = U.User_ID
     WHERE F.Patient_ID = ?
     ORDER BY F.Created_At DESC`,
    [patient_id]
  );
  return rows;
}

// 10. Assign a specialist to a patient (if not already assigned)
async function assignSpecialistToPatient(specialist_id, patient_id) {
  const [existing] = await db.query(
    `SELECT * FROM Specialist_Patient_Assignment WHERE Specialist_ID = ? AND Patient_ID = ?`,
    [specialist_id, patient_id]
  );

  if (existing.length === 0) {
    await db.query(
      `INSERT INTO Specialist_Patient_Assignment (Specialist_ID, Patient_ID, Assigned_At) VALUES (?, ?, NOW())`,
      [specialist_id, patient_id]
    );
  }
}

// AI SUGGESTION FUNCTIONS
// 11. Save an AI-generated suggestion for a patient
async function saveAISuggestion(patient_id, content, based_on_pattern) {
  await db.query(
    `INSERT INTO AI_Suggestion (Patient_ID, Content, Generated_At, Based_On_Pattern) VALUES (?, ?, NOW(), ?)`,
    [patient_id, content, based_on_pattern]
  );
}

// 12. Get latest AI suggestions for a patient (limit to 10)
async function getAISuggestionsByPatient(patient_id) {
  const [rows] = await db.query(
    `SELECT * FROM AI_Suggestion WHERE Patient_ID = ? ORDER BY Generated_At DESC LIMIT 10`,
    [patient_id]
  );
  return rows;
}

// EXPORT FUNCTIONS
module.exports = {
  addReading,
  getReadingsByPatient,
  getReadingsByDateRange,
  updateReading,
  deleteReading,
  getAllPatients,
  searchPatients,
  addFeedback,
  getFeedbackByPatient,
  assignSpecialistToPatient,
  saveAISuggestion,
  getAISuggestionsByPatient
};