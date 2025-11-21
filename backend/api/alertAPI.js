// api/alertAPI.js
// Author: Krish
// Purpose: Manage patient alerts for abnormal readings

const socketManager = require('../socketManager');

// Count abnormal readings in the last 7 days for a patient
function countAbnormalThisWeek(db, patientId, callback) {
  const query = `
    SELECT COUNT(*) AS abnormalCount
    FROM Sugar_Reading
    WHERE Category = 'Abnormal'
      AND Patient_ID = ?
      AND DateTime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `;
  
  db.query(query, [patientId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0].abnormalCount);
  });
}

// Check if alert should trigger (more than 3 abnormal readings)
function shouldTriggerAlert(db, patientId, callback) {
  countAbnormalThisWeek(db, patientId, (err, count) => {
    if (err) return callback(err, null);
    callback(null, count > 3);
  });
}

// Get specialist assigned to patient
function getPatientSpecialist(db, patientId, callback) {
  const query = `
    SELECT Specialist_ID
    FROM Specialist_Patient_Assignment
    WHERE Patient_ID = ?
    ORDER BY Assigned_At DESC
    LIMIT 1
  `;
  
  db.query(query, [patientId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null);
    callback(null, results[0].Specialist_ID);
  });
}

// Create alert record in database
function createAlert(db, patientId, abnormalCount, specialistId, callback) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0); // Set to the beginning of the day

  console.log('createAlert: Calculated weekStart:', weekStart);
  
  const recipients = `Patient ${patientId}, Specialist ${specialistId}`;
  
  const query = `
    INSERT INTO Alert (Patient_ID, Week_Start, Abnormal_Count, Sent_At, Recipients)
    VALUES (?, ?, ?, NOW(), ?)
  `;
  
  const values = [patientId, weekStart, abnormalCount, recipients];
  
  db.query(query, values, (err, results) => {
    if (err) return callback(err, null);
    
    const alertData = {
      alert_id: results.insertId,
      patient_id: patientId,
      week_start: weekStart,
      abnormal_count: abnormalCount,
      recipients: recipients,
      sent_at: new Date()
    };
    
    console.log(`Alert created - ID: ${alertData.alert_id}, Patient: ${patientId}`);
    callback(null, alertData);
  });
}

// Get recent alerts for a patient
function getAlertsByPatient(db, patientId, callback) {
  const query = `
    SELECT *
    FROM Alert
    WHERE Patient_ID = ?
    ORDER BY Sent_At DESC
    LIMIT 10
  `;
  
  db.query(query, [patientId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
}

/**
 * Get undelivered alerts for a specialist's assigned patients.
 * @param {Object} db - Database connection
 * @param {number} specialistId - Specialist ID
 * @param {Function} callback - Callback function(err, alerts)
 */
function getUndeliveredAlertsForSpecialist(db, specialistId, callback) {
  const query = `
    SELECT a.*, p.Name as patientName
    FROM Alert a
    JOIN Specialist_Patient_Assignment spa ON a.Patient_ID = spa.Patient_ID
    JOIN User p ON a.Patient_ID = p.User_ID
    WHERE spa.Specialist_ID = ?
      AND a.Specialist_Delivered_At IS NULL
    ORDER BY a.Sent_At ASC;
  `;
  console.log('getUndeliveredAlertsForSpecialist: Query:', query); // Added log
  console.log('getUndeliveredAlertsForSpecialist: Params:', [specialistId]); // Added log

  db.query(query, [specialistId], (err, results) => {
    if (err) {
      console.error('getUndeliveredAlertsForSpecialist: Error fetching alerts:', err); // Added log
      return callback(err, null);
    }
    console.log('getUndeliveredAlertsForSpecialist: Found alerts:', results.length); // Added log
    callback(null, results);
  });
}

/**
 * Mark an alert as delivered to a specialist.
 * @param {Object} db - Database connection
 * @param {number} alertId - The ID of the alert to mark as delivered.
 * @param {number} specialistId - The ID of the specialist to whom the alert was delivered.
 * @param {Function} callback - Callback function(err, result)
 */
function markAlertAsDeliveredToSpecialist(db, alertId, specialistId, callback) {
  const query = `
    UPDATE Alert
    SET Specialist_Delivered_At = NOW()
    WHERE Alert_ID = ?;
  `;

  db.query(query, [alertId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, { success: true, alert_id: alertId });
  });
}

/**
 * [NEW] Checks if an alert should be triggered for a single patient and sends real-time notifications.
 * This is intended to be called when a new 'Abnormal' reading is logged.
 */
function checkAndTriggerAlerts(db, patientId, callback) {
  countAbnormalThisWeek(db, patientId, (err, abnormalCount) => {
    if (err) return callback(err);

    if (abnormalCount > 3) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      const checkAlertQuery = `SELECT Alert_ID FROM Alert WHERE Patient_ID = ? AND Sent_At >= ?`;
      db.query(checkAlertQuery, [patientId, weekStart], (err, existingAlerts) => {
        if (err) return callback(err);

        if (existingAlerts.length > 0) {
          return callback(null, { status: 'skipped', reason: 'Alert already sent this week' });
        }

        getPatientSpecialist(db, patientId, (err, specialistId) => {
          if (err) return callback(err);

          createAlert(db, patientId, abnormalCount, specialistId, (err, alert) => {
            if (err) return callback(err);

            const notificationData = {
              type: 'alert',
              title: 'Critical Blood Sugar Alert!',
              message: `You have logged ${abnormalCount} abnormal readings this week. Please review your logs.`,
              patientId: patientId,
              timestamp: new Date().toISOString()
            };

            socketManager.sendNotificationToUser(patientId, notificationData);
            if (specialistId) {
              socketManager.sendNotificationToUser(specialistId, { ...notificationData, message: `Patient ${patientId} has logged ${abnormalCount} abnormal readings this week.` });
            }

            callback(null, { status: 'alert_triggered', alert: alert });
          });
        });
      });
    } else {
      callback(null, { status: 'skipped', reason: 'Threshold not met' });
    }
  });
}

// Check all active patients for alerts
function checkAllPatientsForAlerts(db, callback) {
  const triggeredAlerts = [];
  
  // Get all active patients (users with role 'Patient' and status 'Active')
  const query = `
    SELECT u.User_ID AS Patient_ID
    FROM User u
    INNER JOIN Patient p ON u.User_ID = p.Patient_ID
    WHERE u.Role = 'Patient' AND u.Status = 'Active'
  `;
  
  db.query(query, (err, patients) => {
    if (err) return callback(err, null);
    
    if (patients.length === 0) {
      return callback(null, []);
    }
    
    let processedCount = 0;
    
    // Process each patient
    patients.forEach(patient => {
      const patientId = patient.Patient_ID;
      
      // Count abnormal readings
      countAbnormalThisWeek(db, patientId, (err, abnormalCount) => {
        if (err) {
          console.error(`Error counting readings for patient ${patientId}:`, err);
          processedCount++;
          if (processedCount === patients.length) {
            callback(null, triggeredAlerts);
          }
          return;
        }
        
        // Check if alert should trigger
        if (abnormalCount > 3) {
          // Get assigned specialist
          getPatientSpecialist(db, patientId, (err, specialistId) => {
            if (err) {
              console.error(`Error getting specialist for patient ${patientId}:`, err);
              processedCount++;
              if (processedCount === patients.length) {
                callback(null, triggeredAlerts);
              }
              return;
            }
            
            // Create alert
            createAlert(db, patientId, abnormalCount, specialistId, (err, alert) => {
              if (err) {
                console.error(`Error creating alert for patient ${patientId}:`, err);
              } else {
                logAlertNotification(patientId, specialistId, abnormalCount);
                triggeredAlerts.push(alert);
              }
              
              processedCount++;
              if (processedCount === patients.length) {
                callback(null, triggeredAlerts);
              }
            });
          });
        } else {
          processedCount++;
          if (processedCount === patients.length) {
            callback(null, triggeredAlerts);
          }
        }
      });
    });
  });
}

// Log alert notification
function logAlertNotification(patientId, specialistId, abnormalCount) {
  console.log('----------------------------------------------------');
  console.log('  ALERT TRIGGERED');
  console.log(`Patient ${patientId} has ${abnormalCount} abnormal readings this week.`);
  console.log('Notification details:');
  console.log(`- Patient ID: ${patientId}`);
  console.log(`- Specialist ID: ${specialistId}`);
  console.log(' Email/SMS would be sent here in production.');
  console.log('----------------------------------------------------');
}

module.exports = {
  countAbnormalThisWeek,
  shouldTriggerAlert,
  createAlert,
  getAlertsByPatient,
  checkAllPatientsForAlerts,
  logAlertNotification,
  checkAndTriggerAlerts // Added new function to exports
};