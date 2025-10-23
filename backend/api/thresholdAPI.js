// api/thresholdAPI.js
// Handles threshold management (Krish)

const db = require('../db'); // connects to MySQL database

// 1. Get system-wide thresholds
async function getSystemThresholds() {
  const [rows] = await db.query(`
    SELECT *
    FROM categorythreshold
    ORDER BY Effective_Date DESC
    LIMIT 1
  `);
  return rows[0];
}

// 2. Update system thresholds (clinic staff function)
async function updateSystemThresholds(normal_low, normal_high, borderline_low, borderline_high, abnormal_low, abnormal_high) {
  await db.query(`
    INSERT INTO categorythreshold
      (Normal_Low, Normal_High, Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High, Effective_Date)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `, [normal_low, normal_high, borderline_low, borderline_high, abnormal_low, abnormal_high]);
}

// 3. Categorize a reading based on thresholds
async function categorizeReading(value, patient_id) {
  // Check patient-specific thresholds first
  const [patientRows] = await db.query(`
    SELECT Threshold_Normal_Low, Threshold_Normal_High
    FROM patient
    WHERE Patient_ID = ?
  `, [patient_id]);

  let thresholds = patientRows[0];

  // If null, use system thresholds
  if (!thresholds || thresholds.Threshold_Normal_Low === null) {
    const [systemRows] = await db.query(`
      SELECT Normal_Low, Normal_High, Borderline_Low, Borderline_High
      FROM categorythreshold
      ORDER BY Effective_Date DESC
      LIMIT 1
    `);
    thresholds = systemRows[0];
  }

  // Return "Normal", "Borderline", or "Abnormal"
  const { Normal_Low, Normal_High, Borderline_Low, Borderline_High } = thresholds;

  if (value >= Normal_Low && value <= Normal_High) return 'Normal';
  if (value >= Borderline_Low && value <= Borderline_High) return 'Borderline';
  return 'Abnormal';
}

// 4. Update patient-specific thresholds
async function updatePatientThresholds(patient_id, normal_low, normal_high) {
  await db.query(`
    UPDATE patient
    SET Threshold_Normal_Low = ?, Threshold_Normal_High = ?
    WHERE Patient_ID = ?
  `, [normal_low, normal_high, patient_id]);
}

// 5. Get effective thresholds for patient
async function getEffectiveThresholds(patient_id) {
  const [rows] = await db.query(`
    SELECT Threshold_Normal_Low, Threshold_Normal_High
    FROM patient
    WHERE Patient_ID = ?
  `, [patient_id]);

  if (rows.length && rows[0].Threshold_Normal_Low !== null) return rows[0];

  const [systemRows] = await db.query(`
    SELECT Normal_Low, Normal_High, Borderline_Low, Borderline_High
    FROM categorythreshold
    ORDER BY Effective_Date DESC
    LIMIT 1
  `);
  return systemRows[0];
}

module.exports = {
  getSystemThresholds,
  updateSystemThresholds,
  categorizeReading,
  updatePatientThresholds,
  getEffectiveThresholds
};
