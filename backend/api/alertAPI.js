// ===============================================
// File: api/alertAPI.js
// Author: Krish
// Purpose: Manage patient alerts for abnormal readings
// ===============================================

const db = require('../db'); //  Import the MySQL connection

// -------------------------------------------------
// 1. Count abnormal readings this week
// -------------------------------------------------
// Purpose: Count how many 'Abnormal' readings a patient had
// within the last 7 days (from current date/time).
// -------------------------------------------------
// Returns: Integer (abnormalCount)
async function countAbnormalThisWeek(patient_id) {
  const [rows] = await db.query(`
    SELECT COUNT(*) AS abnormalCount
    FROM reading
    WHERE Category = 'Abnormal'
      AND Patient_ID = ?
      AND Reading_DateTime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `, [patient_id]);

  return rows[0].abnormalCount; // Return numeric count
}


// -------------------------------------------------
// 2. Check if alert should trigger
// -------------------------------------------------
// Purpose: Determine whether the abnormal reading count
// exceeds the threshold (more than 3 in a week).
// -------------------------------------------------
// Returns: Boolean → true = trigger alert, false = no alert
async function shouldTriggerAlert(patient_id) {
  const abnormalCount = await countAbnormalThisWeek(patient_id);
  return abnormalCount > 3; // Trigger alert if more than 3 abnormal readings
}


// -------------------------------------------------
// 3. Create alert record
// -------------------------------------------------
// Purpose: Insert a new alert row into MySQL when a patient’s
// abnormal readings exceed the threshold.
// -------------------------------------------------
// Returns: Object { alert_id, patient_id, week_start, abnormal_count, recipients, sent_at }
async function createAlert(patient_id, abnormal_count, specialist_id) {
  // Step 1: Determine start of current week (7 days ago)
  const [dateResult] = await db.query(`
    SELECT DATE_SUB(CURDATE(), INTERVAL 7 DAY) AS week_start
  `);
  const week_start = dateResult[0].week_start;

  // Step 2: Build recipients string
  const recipients = `Patient ${patient_id}, Specialist ${specialist_id}`;

  // Step 3: Insert a new alert row in MySQL
  const [result] = await db.query(`
    INSERT INTO alert (Patient_ID, Week_Start, Abnormal_Count, Sent_At, Recipients)
    VALUES (?, ?, ?, NOW(), ?)
  `, [patient_id, week_start, abnormal_count, recipients]);

  const alertId = result.insertId; // MySQL auto-incremented ID

  console.log(` Alert created — ID: ${alertId}, Patient: ${patient_id}, Week: ${week_start}`);

  // Step 4: Return the inserted alert details
  return {
    alert_id: alertId,
    patient_id: patient_id,
    week_start: week_start,
    abnormal_count: abnormal_count,
    recipients: recipients,
    sent_at: new Date() // optional, represents current time
  };
}


// -------------------------------------------------
// 4. Get recent alerts for a patient
// -------------------------------------------------
// Purpose: Retrieve the most recent 10 alerts for a patient
// (useful for dashboard or clinician view)
// -------------------------------------------------
async function getAlertsByPatient(patient_id) {
  const [rows] = await db.query(`
    SELECT *
    FROM alert
    WHERE Patient_ID = ?
    ORDER BY Sent_At DESC
    LIMIT 10
  `, [patient_id]);

  return rows; // Returns an array of alert objects
}


// -------------------------------------------------
// 5. Check all patients for alerts
// -------------------------------------------------
// Purpose: Run through all active patients, count abnormal readings,
// and trigger alerts if necessary
// -------------------------------------------------
// Returns: Array of all alerts triggered during this run
async function checkAllPatientsForAlerts() {
  const triggeredAlerts = [];

  // Step 1: Fetch all active patients
  const [patients] = await db.query(`
    SELECT Patient_ID, Specialist_ID
    FROM patient
    WHERE Status = 'Active'
  `);

  // Step 2: Loop through each patient
  for (const patient of patients) {
    const patientId = patient.Patient_ID;
    const specialistId = patient.Specialist_ID;

    // Step 3: Count abnormal readings
    const abnormalCount = await countAbnormalThisWeek(patientId);

    // Step 4: Check if alert condition met
    if (await shouldTriggerAlert(patientId)) {
      // Step 5: Create alert in database
      const newAlert = await createAlert(patientId, abnormalCount, specialistId);

      // Step 6: Log alert notification (or send email/SMS in production)
      logAlertNotification(patientId, specialistId, abnormalCount);

      // Step 7: Store the result in memory (for summary/logging)
      triggeredAlerts.push(newAlert);
    }
  }

  // Step 8: Return all alerts triggered during this batch
  return triggeredAlerts;
}


// -------------------------------------------------
// 6. Log alert notification
// -------------------------------------------------
// Purpose: Display a clear summary of the alert being triggered.
// In a real system, this would send an email or SMS.
function logAlertNotification(patient_id, specialist_id, abnormal_count) {
  console.log('----------------------------------------------------');
  console.log('  ALERT TRIGGERED');
  console.log(`Patient ${patient_id} has ${abnormal_count} abnormal readings this week.`);
  console.log('Notification details:');
  console.log(`- Patient ID: ${patient_id}`);
  console.log(`- Specialist ID: ${specialist_id}`);
  console.log(' Email/SMS would be sent here in production.');
  console.log('----------------------------------------------------');
}


// -------------------------------------------------
// Export all functions for use in routes or cron jobs
// -------------------------------------------------
module.exports = {
  countAbnormalThisWeek,
  shouldTriggerAlert,
  createAlert,
  getAlertsByPatient,
  checkAllPatientsForAlerts,
  logAlertNotification
};
