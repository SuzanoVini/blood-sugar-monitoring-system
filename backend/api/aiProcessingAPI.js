// api/aiProcessingAPI.js
// Author: Gemini
// Purpose: Handles the server-side AI pattern analysis of blood sugar readings.

function splitAndNormalize(text) {
  if (!text) return [];
  return text
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function timeBucket(datetime) {
  const hour = new Date(datetime).getHours();
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 19) return "afternoon";
  return "evening";
}

/**
 * Analyzes a patient's readings, identifies patterns in abnormal readings,
 * and stores suggestions and analysis results in the database.
 * This is intended to be triggered after a new 'Abnormal' reading is added.
 * 
 * @param {Object} db - Database connection
 * @param {number} patientId - The ID of the patient to analyze.
 * @param {Function} callback - Callback function(err, result)
 */
function analyzeAndCreateSuggestions(db, patientId, callback) {
  // 1. Fetch all readings for the patient
  const readingsQuery = `
    SELECT Reading_ID, DateTime, Category, Food_Notes, Activity_Notes, Event, Symptoms, Notes 
    FROM Sugar_Reading 
    WHERE Patient_ID = ? ORDER BY DateTime DESC
  `;

  db.query(readingsQuery, [patientId], (err, readings) => {
    if (err) {
      console.error(`AI Processing Error: Could not fetch readings for patient ${patientId}`, err);
      return callback(err);
    }

    const minOccurrences = 3;
    const minPercent = 0.4;

    // 2. Filter for abnormal readings
    const abnormal = readings.filter(r => r.Category === 'Abnormal');

    if (abnormal.length < minOccurrences) {
      return callback(null, { status: 'skipped', reason: 'Not enough abnormal readings to analyze.' });
    }

    // 3. Perform pattern analysis (similar to frontend logic)
    const itemMap = {};
    abnormal.forEach(r => {
      const items = [
        ...splitAndNormalize(r.Food_Notes), 
        ...splitAndNormalize(r.Activity_Notes),
        ...splitAndNormalize(r.Event),
        ...splitAndNormalize(r.Symptoms),
        ...splitAndNormalize(r.Notes)
      ];
      const bucket = timeBucket(r.DateTime);
      const readingId = r.Reading_ID;

      items.forEach(item => {
        if (!itemMap[item]) itemMap[item] = { count: 0, readings: new Set(), times: {} };
        if (!itemMap[item].readings.has(readingId)) {
          itemMap[item].readings.add(readingId);
          itemMap[item].count = itemMap[item].readings.size;
        }
        itemMap[item].times[bucket] = (itemMap[item].times[bucket] || 0) + 1;
      });
    });

    // 4. Save the analysis result to the AIPatternAnalyzer table
    const analysisData = { totalAbnormal: abnormal.length, items: itemMap };
    const analysisQuery = `
      INSERT INTO AIPatternAnalyzer (Patient_ID, Analysis_DateTime, Pattern_Data) 
      VALUES (?, NOW(), ?)
      ON DUPLICATE KEY UPDATE Pattern_Data = VALUES(Pattern_Data);
    `;
    // Note: AIPatternAnalyzer table would need a UNIQUE key on Patient_ID for ON DUPLICATE KEY to work, or use REPLACE.
    // For now, we will just insert a new analysis each time.
    const insertAnalysisQuery = `INSERT INTO AIPatternAnalyzer (Patient_ID, Analysis_DateTime, Pattern_Data) VALUES (?, NOW(), ?)`
    db.query(insertAnalysisQuery, [patientId, JSON.stringify(analysisData)], (err, analysisResult) => {
        if (err) {
            // Non-critical error, so we just log it and continue to creating suggestions
            console.error(`AI Processing Error: Could not save analysis for patient ${patientId}`, err);
        } else {
            console.log(`AI analysis saved for patient ${patientId}. Analysis ID: ${analysisResult.insertId}`);
        }
    });

    // 5. Check for patterns and create suggestions
    let suggestionsCreated = 0;
    const patternsToProcess = Object.entries(itemMap);
    let patternsProcessed = 0;

    if (patternsToProcess.length === 0) {
      return callback(null, { status: 'completed', patterns_found: 0, suggestions_created: 0 });
    }

    patternsToProcess.forEach(([item, data]) => {
      const occurrences = data.count;
      const percent = occurrences / abnormal.length;

      if (occurrences >= minOccurrences && percent >= minPercent) {
        const timing = Object.entries(data.times).sort((a, b) => b[1] - a[1])[0]?.[0] || "various times";
        const strength = percent >= 0.7 ? "strong" : "moderate";
        const message = strength === "strong"
          ? `A strong pattern detected: Your blood sugar was abnormal in ${Math.round(percent * 100)}% of cases after '${item}'. Consider avoiding or reducing it.`
          : `A pattern detected: Your blood sugar was abnormal in ${Math.round(percent * 100)}% of cases after '${item}'. Consider portion control or timing changes.`;
        
        const basedOnPattern = `${item} (${occurrences}/${abnormal.length} times)`;

        // Save the suggestion to the database
        const suggestionQuery = `
          INSERT INTO AI_Suggestion (Patient_ID, Content, Generated_At, Based_On_Pattern)
          VALUES (?, ?, NOW(), ?)
        `;
        db.query(suggestionQuery, [patientId, message, basedOnPattern], (err, suggestionResult) => {
          if (err) {
            console.error(`AI Processing Error: Could not create suggestion for patient ${patientId}`, err);
          } else {
            suggestionsCreated++;
            console.log(`AI suggestion created for patient ${patientId}. Suggestion ID: ${suggestionResult.insertId}`);
          }
          patternsProcessed++;
          if (patternsProcessed === patternsToProcess.length) {
            callback(null, { status: 'completed', patterns_found: patternsToProcess.length, suggestions_created: suggestionsCreated });
          }
        });
      } else {
        patternsProcessed++;
        if (patternsProcessed === patternsToProcess.length) {
          callback(null, { status: 'completed', patterns_found: patternsToProcess.length, suggestions_created: suggestionsCreated });
        }
      }
    });
  });
}

module.exports = {
  analyzeAndCreateSuggestions
};
