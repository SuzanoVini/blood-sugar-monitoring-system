// api/thresholdAPI.js
// Handles threshold management (Krish)

function getSystemThresholds(db, callback) {
  const query = `
    SELECT *
    FROM categorythreshold
    ORDER BY Effective_Date DESC
    LIMIT 1
  `;
  
  db.query(query, (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0]);
  });
}

// Update system thresholds
function updateSystemThresholds(db, thresholdData, callback) {
  const { normal_low, normal_high, borderline_low, borderline_high, abnormal_low, abnormal_high } = thresholdData;
  
  const query = `
    INSERT INTO categorythreshold
      (Normal_Low, Normal_High, Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High, Effective_Date)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  
  const values = [normal_low, normal_high, borderline_low, borderline_high, abnormal_low, abnormal_high];
  
  db.query(query, values, (err, results) => {
    if (err) return callback(err, null);
    callback(null, { success: true, threshold_id: results.insertId });
  });
}

// Categorize a reading based on thresholds
function categorizeReading(db, value, patient_id, callback) {
  // Get patient-specific thresholds
  const patientQuery = `
    SELECT Threshold_Normal_Low, Threshold_Normal_High
    FROM patient
    WHERE Patient_ID = ?
  `;
  
  db.query(patientQuery, [patient_id], (err, patientResults) => {
    if (err) return callback(err, null);
    
    const patientThresholds = patientResults[0];
    
    // If patient has custom thresholds for Normal range
    if (patientThresholds.Threshold_Normal_Low !== null && patientThresholds.Threshold_Normal_High !== null) {
      const normalLow = patientThresholds.Threshold_Normal_Low;
      const normalHigh = patientThresholds.Threshold_Normal_High;
      
      if (value >= normalLow && value <= normalHigh) {
        return callback(null, 'Normal');
      }
      
      // Get system thresholds for Borderline/Abnormal
      const systemQuery = `
        SELECT Borderline_Low, Borderline_High
        FROM categorythreshold
        ORDER BY Effective_Date DESC
        LIMIT 1
      `;
      
      db.query(systemQuery, (err, systemResults) => {
        if (err) return callback(err, null);
        
        const system = systemResults[0];
        if (value >= system.Borderline_Low && value <= system.Borderline_High) {
          return callback(null, 'Borderline');
        }
        callback(null, 'Abnormal');
      });
    } else {
      // Use system thresholds entirely
      const systemQuery = `
        SELECT Normal_Low, Normal_High, Borderline_Low, Borderline_High
        FROM categorythreshold
        ORDER BY Effective_Date DESC
        LIMIT 1
      `;
      
      db.query(systemQuery, (err, systemResults) => {
        if (err) return callback(err, null);
        
        const thresholds = systemResults[0];
        
        if (value >= thresholds.Normal_Low && value <= thresholds.Normal_High) {
          return callback(null, 'Normal');
        }
        if (value >= thresholds.Borderline_Low && value <= thresholds.Borderline_High) {
          return callback(null, 'Borderline');
        }
        callback(null, 'Abnormal');
      });
    }
  });
}

// Update patient-specific thresholds
function updatePatientThresholds(db, patient_id, normal_low, normal_high, callback) {
  const query = `
    UPDATE patient
    SET Threshold_Normal_Low = ?, Threshold_Normal_High = ?
    WHERE Patient_ID = ?
  `;
  
  db.query(query, [normal_low, normal_high, patient_id], (err, results) => {
    if (err) return callback(err, null);
    callback(null, { success: true });
  });
}

// Get effective thresholds for patient
function getEffectiveThresholds(db, patient_id, callback) {
  const patientQuery = `
    SELECT Threshold_Normal_Low, Threshold_Normal_High
    FROM patient
    WHERE Patient_ID = ?
  `;
  
  db.query(patientQuery, [patient_id], (err, patientResults) => {
    if (err) return callback(err, null);
    
    const patientThresholds = patientResults[0];
    
    // Patient has custom thresholds
    if (patientThresholds.Threshold_Normal_Low !== null && patientThresholds.Threshold_Normal_High !== null) {
      const systemQuery = `
        SELECT Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High
        FROM categorythreshold
        ORDER BY Effective_Date DESC
        LIMIT 1
      `;
      
      db.query(systemQuery, (err, systemResults) => {
        if (err) return callback(err, null);
        
        const system = systemResults[0];
        callback(null, {
          Normal_Low: patientThresholds.Threshold_Normal_Low,
          Normal_High: patientThresholds.Threshold_Normal_High,
          Borderline_Low: system.Borderline_Low,
          Borderline_High: system.Borderline_High,
          Abnormal_Low: system.Abnormal_Low,
          Abnormal_High: system.Abnormal_High
        });
      });
    } else {
      // Return system thresholds
      const systemQuery = `
        SELECT Normal_Low, Normal_High, Borderline_Low, Borderline_High, Abnormal_Low, Abnormal_High
        FROM categorythreshold
        ORDER BY Effective_Date DESC
        LIMIT 1
      `;
      
      db.query(systemQuery, (err, systemResults) => {
        if (err) return callback(err, null);
        callback(null, systemResults[0]);
      });
    }
  });
}

// Delete a threshold by ID, or latest if no ID provided
function deleteThreshold(db, thresholdId, callback) {
  if (thresholdId) {
    // Delete specific threshold by ID
    const query = 'DELETE FROM categorythreshold WHERE Threshold_ID = ?';
    db.query(query, [thresholdId], (err, results) => {
      if (err) return callback(err, null);
      if (results.affectedRows === 0) {
        return callback(new Error('Threshold not found'), null);
      }
      callback(null, { success: true, threshold_id: thresholdId, deleted: true });
    });
  } else {
    // Delete latest threshold
    const getLatestQuery = `
      SELECT Threshold_ID
      FROM categorythreshold
      ORDER BY Effective_Date DESC
      LIMIT 1
    `;

    db.query(getLatestQuery, (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) {
        return callback(new Error('No thresholds found to delete'), null);
      }

      const latestId = results[0].Threshold_ID;
      const deleteQuery = 'DELETE FROM categorythreshold WHERE Threshold_ID = ?';

      db.query(deleteQuery, [latestId], (err, deleteResults) => {
        if (err) return callback(err, null);
        callback(null, { success: true, threshold_id: latestId, deleted: true });
      });
    });
  }
}

module.exports = {
  getSystemThresholds,
  updateSystemThresholds,
  categorizeReading,
  updatePatientThresholds,
  getEffectiveThresholds,
  deleteThreshold
};