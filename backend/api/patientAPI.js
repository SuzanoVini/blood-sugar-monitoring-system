// api/patientAPI.js
// Author: Vinicius Suzano
// Purpose: API functions for patient-specific operations including blood sugar readings,
//          AI suggestions, and alerts management

const thresholdAPI = require('./thresholdAPI');
const aiProcessingAPI = require('./aiProcessingAPI'); // Import the AI processing module
const alertAPI = require('../api/alertAPI'); // Import the Alert processing module

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

  const providedDateTime = new Date(dateTime);
  if (isNaN(providedDateTime.getTime())) {
    return callback(new Error('Invalid date format provided for reading'), null);
  }
  if (providedDateTime > new Date()) {
    return callback(new Error('Reading date and time cannot be in the future'), null);
  }

  console.log('addReading: Categorizing reading...');
  // First, categorize the reading based on thresholds
  thresholdAPI.categorizeReading(db, value, patientId, (err, category) => {
    if (err) {
      console.error('addReading: Error categorizing reading:', err);
      return callback(err, null);
    }
    console.log('addReading: Reading categorized as:', category);

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

    console.log('addReading: Inserting reading into database...');
    db.query(query, values, (err, results) => {
      if (err) {
        console.error('addReading: Error inserting reading into database:', err);
        return callback(err, null);
      }
      console.log('addReading: Reading inserted into database. ID:', results.insertId);

      const newReading = {
        reading_id: results.insertId,
        patient_id: patientId,
        dateTime: dateTime,
        value: value,
        unit: unit || 'mg/dL',
        category: category
      };

      console.log(`New reading added - ID: ${newReading.reading_id}, Patient: ${patientId}, Category: ${category}`);

      // If the new reading is abnormal, trigger background processing tasks.
      if (category === 'Abnormal') {
        // Trigger AI analysis
        console.log(`addReading: Abnormal reading detected. Triggering AI analysis for patient ${patientId}...`);
        aiProcessingAPI.analyzeAndCreateSuggestions(db, patientId, (aiErr, aiResult) => {
          if (aiErr) {
            console.error(`addReading: AI background processing failed for patient ${patientId}:`, aiErr);
          } else {
            console.log(`addReading: AI background processing completed for patient ${patientId}:`, aiResult);
          }
        });

        // Check for abnormal readings count and trigger alerts (email + DB record + Socket.IO)
        console.log(`addReading: Abnormal reading detected. Triggering alert system for patient ${patientId}...`);
        alertAPI.checkAndTriggerAlerts(db, patientId, (alertErr, alertResult) => {
          if (alertErr) {
            console.error(`addReading: Alert processing failed for patient ${patientId}:`, alertErr);
          } else {
            console.log(`addReading: Alert processing completed for patient ${patientId}:`, alertResult);
          }
        });
      }

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
        const providedDateTime = new Date(updateData.dateTime);
        if (isNaN(providedDateTime.getTime())) {
          return callback(new Error('Invalid date format provided for reading'), null);
        }
        if (providedDateTime > new Date()) {
          return callback(new Error('Reading date and time cannot be in the future'), null);
        }
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
 * Analyze patient reading patterns and generate AI suggestions
 * @param {Object} db - Database connection
 * @param {number} patientId - Patient ID
 * @param {Function} callback - Callback function(err, suggestions)
 */
function generateAISuggestions(db, patientId, callback) {
  // Query abnormal readings from last 4 weeks
  const query = `
    SELECT Value, Food_Notes, Activity_Notes, Symptoms, DateTime
    FROM Sugar_Reading
    WHERE Patient_ID = ?
      AND Category = 'Abnormal'
      AND DateTime >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
    ORDER BY DateTime DESC
  `;

  db.query(query, [patientId], (err, abnormalReadings) => {
    if (err) return callback(err, null);

    const suggestions = [];

    // Check if patient has significant abnormal readings
    if (abnormalReadings.length >= 3) {
      // Analyze food patterns
      const foodKeywords = {};
      const activityKeywords = {};

      abnormalReadings.forEach(reading => {
        // Extract food keywords
        if (reading.Food_Notes) {
          const foods = reading.Food_Notes.toLowerCase();
          ['pizza', 'pasta', 'rice', 'bread', 'dessert', 'soda', 'cake', 'sugar', 'candy', 'beer', 'alcohol'].forEach(keyword => {
            if (foods.includes(keyword)) {
              foodKeywords[keyword] = (foodKeywords[keyword] || 0) + 1;
            }
          });
        }

        // Extract activity keywords
        if (reading.Activity_Notes) {
          const activities = reading.Activity_Notes.toLowerCase();
          ['exercise', 'running', 'gym', 'workout', 'walking', 'stress', 'sleep', 'rest'].forEach(keyword => {
            if (activities.includes(keyword)) {
              activityKeywords[keyword] = (activityKeywords[keyword] || 0) + 1;
            }
          });
        }
      });

      const totalAbnormal = abnormalReadings.length;

      // Generate suggestions for food triggers (>40% correlation)
      Object.keys(foodKeywords).forEach(food => {
        const frequency = foodKeywords[food] / totalAbnormal;
        if (frequency > 0.4) {
          const percentage = Math.round(frequency * 100);
          suggestions.push({
            content: `Your abnormal readings often occur after consuming ${food}. Consider moderating your ${food} intake or monitoring portion sizes.`,
            pattern: `${percentage}% correlation with ${food} consumption (${foodKeywords[food]} of ${totalAbnormal} abnormal readings)`
          });
        }
      });

      // Generate suggestions for activity patterns (>40% correlation)
      Object.keys(activityKeywords).forEach(activity => {
        const frequency = activityKeywords[activity] / totalAbnormal;
        if (frequency > 0.4) {
          const percentage = Math.round(frequency * 100);
          if (['stress', 'sleep'].includes(activity)) {
            suggestions.push({
              content: `${percentage}% of your abnormal readings are associated with ${activity} issues. Managing ${activity} may help stabilize your blood sugar levels.`,
              pattern: `${percentage}% correlation with ${activity} (${activityKeywords[activity]} of ${totalAbnormal} abnormal readings)`
            });
          }
        }
      });

      // General suggestion if high abnormal count but no specific patterns
      if (suggestions.length === 0) {
        suggestions.push({
          content: `You have ${totalAbnormal} abnormal readings in the last 4 weeks. Consider reviewing your diet and activity patterns with your specialist to identify potential triggers.`,
          pattern: `${totalAbnormal} abnormal readings in last 4 weeks`
        });
      }

      // Limit to 3 most relevant suggestions
      const limitedSuggestions = suggestions.slice(0, 3);

      // Insert suggestions into database
      let completed = 0;
      const results = [];

      limitedSuggestions.forEach(suggestion => {
        createSuggestion(db, patientId, suggestion.content, suggestion.pattern, (err, result) => {
          if (!err) results.push(result);
          completed++;

          if (completed === limitedSuggestions.length) {
            callback(null, results);
          }
        });
      });

      // Handle case where no suggestions to insert
      if (limitedSuggestions.length === 0) {
        callback(null, []);
      }
    } else {
      // Not enough abnormal readings to analyze
      callback(null, []);
    }
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
  generateAISuggestions,
  getReadingStatistics,
  verifyPatient
};
