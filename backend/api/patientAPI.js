// api/patientAPI.js
// Author: Vinicius Suzano
// Purpose: API functions for patient-specific operations including blood sugar readings,
//          AI suggestions, and alerts management

const thresholdAPI = require('./thresholdAPI');

/**
 * Get blood sugar readings for a patient with optional filtering and pagination
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Object} filters - Optional filters: { startDate, endDate, category, limit, offset }
 * @param {Function} callback - Callback function(err, results)
 */
function getPatientReadings(db, patientId, filters, callback) {
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

  // Apply date range filters
  if (filters.startDate) {
    query += ' AND DateTime >= ?';
    queryParams.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ' AND DateTime <= ?';
    queryParams.push(filters.endDate);
  }

  // Apply category filter
  if (filters.category) {
    query += ' AND Category = ?';
    queryParams.push(filters.category);
  }

  // Order by most recent first
  query += ' ORDER BY DateTime DESC';

  // Apply pagination
  if (filters.limit) {
    query += ' LIMIT ?';
    queryParams.push(parseInt(filters.limit));

    if (filters.offset) {
      query += ' OFFSET ?';
      queryParams.push(parseInt(filters.offset));
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('getPatientReadings query:', query);
    console.log('getPatientReadings params:', queryParams);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) return callback(err, null);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`getPatientReadings: Found ${results.length} readings for patient ${patientId}`);
    }

    callback(null, results);
  });
}

/**
 * Get total count of readings for pagination
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Object} filters - Optional filters: { startDate, endDate, category }
 * @param {Function} callback - Callback function(err, count)
 */
function getReadingsCount(db, patientId, filters, callback) {
  let query = `
    SELECT COUNT(*) as total
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

  db.query(query, queryParams, (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0].total);
  });
}

/**
 * Add a new blood sugar reading
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Object} readingData - Reading data object
 * @param {Function} callback - Callback function(err, result)
 */
function addReading(db, patientId, readingData, callback) {
  const { dateTime, value, unit, foodNotes, activityNotes, event, symptoms, notes } = readingData;

  // First, categorize the reading based on thresholds
  thresholdAPI.categorizeReading(db, value, patientId, (err, category) => {
    if (err) return callback(err, null);

    const query = `
      INSERT INTO Sugar_Reading
        (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      patientId,
      dateTime,
      value,
      unit || 'mg/dL',
      foodNotes || null,
      activityNotes || null,
      event || null,
      symptoms || null,
      notes || null,
      category
    ];

    db.query(query, values, (err, results) => {
      if (err) return callback(err, null);

      const newReading = {
        reading_id: results.insertId,
        patient_id: patientId,
        dateTime: dateTime,
        value: value,
        unit: unit || 'mg/dL',
        category: category
      };

      console.log(`New reading added - ID: ${newReading.reading_id}, Patient: ${patientId}, Category: ${category}`);
      callback(null, newReading);
    });
  });
}

/**
 * Update an existing blood sugar reading
 * @param {Object} db - Database connection
 * @param {number} readingId - Reading ID to update
 * @param {number} patientId - Patient ID (for verification)
 * @param {Object} updateData - Data to update
 * @param {Function} callback - Callback function(err, result)
 */
function updateReading(db, readingId, patientId, updateData, callback) {
  // First verify the reading belongs to this patient
  const verifyQuery = 'SELECT Patient_ID FROM Sugar_Reading WHERE Reading_ID = ?';

  db.query(verifyQuery, [readingId], (err, results) => {
    if (err) return callback(err, null);

    if (results.length === 0) {
      return callback(new Error('Reading not found'), null);
    }

    if (results[0].Patient_ID !== patientId) {
      return callback(new Error('Unauthorized: Reading does not belong to this patient'), null);
    }

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const queryParams = [];

    if (updateData.value !== undefined) {
      // If value is being updated, recategorize
      thresholdAPI.categorizeReading(db, updateData.value, patientId, (err, category) => {
        if (err) return callback(err, null);

        updateData.category = category;
        executeUpdate();
      });
    } else {
      executeUpdate();
    }

    function executeUpdate() {
      if (updateData.dateTime !== undefined) {
        updateFields.push('DateTime = ?');
        queryParams.push(updateData.dateTime);
      }

      if (updateData.value !== undefined) {
        updateFields.push('Value = ?');
        queryParams.push(updateData.value);
      }

      if (updateData.unit !== undefined) {
        updateFields.push('Unit = ?');
        queryParams.push(updateData.unit);
      }

      if (updateData.foodNotes !== undefined) {
        updateFields.push('Food_Notes = ?');
        queryParams.push(updateData.foodNotes);
      }

      if (updateData.activityNotes !== undefined) {
        updateFields.push('Activity_Notes = ?');
        queryParams.push(updateData.activityNotes);
      }

      if (updateData.event !== undefined) {
        updateFields.push('Event = ?');
        queryParams.push(updateData.event);
      }

      if (updateData.symptoms !== undefined) {
        updateFields.push('Symptoms = ?');
        queryParams.push(updateData.symptoms);
      }

      if (updateData.notes !== undefined) {
        updateFields.push('Notes = ?');
        queryParams.push(updateData.notes);
      }

      if (updateData.category !== undefined) {
        updateFields.push('Category = ?');
        queryParams.push(updateData.category);
      }

      if (updateFields.length === 0) {
        return callback(new Error('No fields to update'), null);
      }

      queryParams.push(readingId);

      const updateQuery = `
        UPDATE Sugar_Reading
        SET ${updateFields.join(', ')}
        WHERE Reading_ID = ?
      `;

      db.query(updateQuery, queryParams, (err, results) => {
        if (err) return callback(err, null);

        if (results.affectedRows === 0) {
          return callback(new Error('Reading not found'), null);
        }

        console.log(`Reading updated - ID: ${readingId}, Patient: ${patientId}`);
        callback(null, { success: true, reading_id: readingId });
      });
    }
  });
}

/**
 * Delete a blood sugar reading
 * @param {Object} db - Database connection
 * @param {number} readingId - Reading ID to delete
 * @param {number} patientId - Patient ID (for verification)
 * @param {Function} callback - Callback function(err, result)
 */
function deleteReading(db, readingId, patientId, callback) {
  // First verify the reading belongs to this patient
  const verifyQuery = 'SELECT Patient_ID FROM Sugar_Reading WHERE Reading_ID = ?';

  db.query(verifyQuery, [readingId], (err, results) => {
    if (err) return callback(err, null);

    if (results.length === 0) {
      return callback(new Error('Reading not found'), null);
    }

    if (results[0].Patient_ID !== patientId) {
      return callback(new Error('Unauthorized: Reading does not belong to this patient'), null);
    }

    const deleteQuery = 'DELETE FROM Sugar_Reading WHERE Reading_ID = ?';

    db.query(deleteQuery, [readingId], (err, results) => {
      if (err) return callback(err, null);

      if (results.affectedRows === 0) {
        return callback(new Error('Reading not found'), null);
      }

      console.log(`Reading deleted - ID: ${readingId}, Patient: ${patientId}`);
      callback(null, { success: true, reading_id: readingId });
    });
  });
}

/**
 * Get AI-generated suggestions for a patient
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {number} limit - Maximum number of suggestions to retrieve
 * @param {Function} callback - Callback function(err, suggestions)
 */
function getPatientSuggestions(db, patientId, limit, callback) {
  const query = `
    SELECT
      Suggestion_ID,
      Patient_ID,
      Content,
      Generated_At,
      Based_On_Pattern
    FROM AI_Suggestion
    WHERE Patient_ID = ?
    ORDER BY Generated_At DESC
    LIMIT ?
  `;

  db.query(query, [patientId, limit || 10], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
}

/**
 * Create a new AI suggestion for a patient
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {string} content - Suggestion content
 * @param {string} basedOnPattern - Pattern that triggered the suggestion
 * @param {Function} callback - Callback function(err, result)
 */
function createSuggestion(db, patientId, content, basedOnPattern, callback) {
  const query = `
    INSERT INTO AI_Suggestion (Patient_ID, Content, Based_On_Pattern, Generated_At)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(query, [patientId, content, basedOnPattern], (err, results) => {
    if (err) return callback(err, null);

    const suggestion = {
      suggestion_id: results.insertId,
      patient_id: patientId,
      content: content,
      based_on_pattern: basedOnPattern,
      generated_at: new Date()
    };

    console.log(`AI Suggestion created - ID: ${suggestion.suggestion_id}, Patient: ${patientId}`);
    callback(null, suggestion);
  });
}

/**
 * Get statistics about patient's readings
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Object} filters - Optional filters: { startDate, endDate }
 * @param {Function} callback - Callback function(err, stats)
 */
function getReadingStatistics(db, patientId, filters, callback) {
  let query = `
    SELECT
      COUNT(*) as total_readings,
      AVG(Value) as average_value,
      MIN(Value) as min_value,
      MAX(Value) as max_value,
      SUM(CASE WHEN Category = 'Normal' THEN 1 ELSE 0 END) as normal_count,
      SUM(CASE WHEN Category = 'Borderline' THEN 1 ELSE 0 END) as borderline_count,
      SUM(CASE WHEN Category = 'Abnormal' THEN 1 ELSE 0 END) as abnormal_count
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

  db.query(query, queryParams, (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0]);
  });
}

/**
 * Verify patient exists and is active
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Function} callback - Callback function(err, isValid)
 */
function verifyPatient(db, patientId, callback) {
  const query = `
    SELECT u.User_ID, u.Status, u.Role
    FROM User u
    INNER JOIN Patient p ON u.User_ID = p.Patient_ID
    WHERE p.Patient_ID = ?
  `;

  db.query(query, [patientId], (err, results) => {
    if (err) return callback(err, null);

    if (results.length === 0) {
      return callback(null, { valid: false, message: 'Patient not found' });
    }

    const user = results[0];

    if (user.Role !== 'Patient') {
      return callback(null, { valid: false, message: 'User is not a patient' });
    }

    if (user.Status !== 'Active') {
      return callback(null, { valid: false, message: 'Patient account is not active' });
    }

    callback(null, { valid: true, message: 'Patient is valid' });
  });
}

module.exports = {
  getPatientReadings,
  getReadingsCount,
  addReading,
  updateReading,
  deleteReading,
  getPatientSuggestions,
  createSuggestion,
  getReadingStatistics,
  verifyPatient
};
