// api/reportingAPI.js
// Purpose: API functions for generating and managing system-wide reports for administrators.

/**
 * Retrieves all previously generated reports.
 * @param {Object} db - Database connection
 * @param {Function} callback - Callback function(err, results)
 */
function getReports(db, callback) {
  const query = `
    SELECT
      r.Report_ID,
      r.Admin_ID,
      u.Name AS Generated_By,
      r.Period_Type,
      r.Period_Start,
      r.Period_End,
      r.Generated_At,
      r.Summary_Data
    FROM Report r
    JOIN User u ON r.Admin_ID = u.User_ID
    ORDER BY r.Generated_At DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching reports:', err);
      return callback(err, null);
    }
    callback(null, results);
  });
}

/**
 * Generates a new system report for a given period and saves it to the database.
 * @param {Object} db - Database connection
 * @param {number} adminId - The ID of the admin generating the report.
 * @param {string} periodType - 'Monthly' or 'Yearly'.
 * @param {string} periodStart - The start date of the report period (e.g., '2025-10-01').
 * @param {string} periodEnd - The end date of the report period (e.g., '2025-10-31').
 * @param {Function} callback - Callback function(err, result)
 */
function generateReport(db, adminId, periodType, periodStart, periodEnd, callback) {
  let activePatients = [];
  let readingStats = {};
  let patientReadingStats = [];
  let aiInsights = {};

  let queriesCompleted = 0;
  const totalQueries = 4; // We will run four main queries

  // ... (existing queries for patients and reading stats)

  // Query 4: Get AI insights for the period
  const aiInsightsQuery = `
    SELECT Food_Notes, Activity_Notes
    FROM Sugar_Reading
    WHERE Category = 'Abnormal' AND DateTime BETWEEN ? AND ?;
  `;
  db.query(aiInsightsQuery, [periodStart, periodEnd], (err, results) => {
    if (err) return callback(err);
    
    const triggerMap = {};
    results.forEach(row => {
      const triggers = [
        ...(row.Food_Notes ? row.Food_Notes.split(',').map(s => s.trim().toLowerCase()) : []),
        ...(row.Activity_Notes ? row.Activity_Notes.split(',').map(s => s.trim().toLowerCase()) : [])
      ];
      triggers.forEach(trigger => {
        if (trigger) {
          triggerMap[trigger] = (triggerMap[trigger] || 0) + 1;
        }
      });
    });

    // Get top 3 triggers
    const topTriggers = Object.entries(triggerMap)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([trigger, count]) => ({ trigger, count }));

    aiInsights = { topTriggers };
    checkCompletion();
  });

  // Query 1: Get all patients
  const patientsQuery = `
    SELECT p.Patient_ID, u.Name, u.Email
    FROM Patient p
    JOIN User u ON p.Patient_ID = u.User_ID
    ORDER BY u.Name;
  `;
  db.query(patientsQuery, (err, results) => {
    if (err) return callback(err);
    activePatients = results.map(p => ({
      id: p.Patient_ID,
      name: p.Name,
      email: p.Email,
      total_readings: 0,
      average_reading: null,
      highest_reading: null,
      lowest_reading: null
    }));
    checkCompletion();
  });

  // Query 2: Get reading statistics for each patient in the period
  const patientReadingsQuery = `
    SELECT
      Patient_ID,
      COUNT(Reading_ID) AS total_readings,
      AVG(Value) AS average_reading,
      MAX(Value) AS highest_reading,
      MIN(Value) AS lowest_reading
    FROM Sugar_Reading
    WHERE DateTime BETWEEN ? AND ?
    GROUP BY Patient_ID;
  `;
  db.query(patientReadingsQuery, [periodStart, periodEnd], (err, results) => {
    if (err) return callback(err);
    patientReadingStats = results;
    checkCompletion();
  });


  // Query 3: Get overall reading statistics for the period
  const readingsQuery = `
    SELECT
      COUNT(*) AS total_readings,
      COUNT(DISTINCT Patient_ID) AS active_patients_count,
      AVG(Value) AS avg_reading,
      MIN(Value) AS min_reading,
      MAX(Value) AS max_reading,
      SUM(CASE WHEN Category = 'Normal' THEN 1 ELSE 0 END) AS normal_count,
      SUM(CASE WHEN Category = 'Borderline' THEN 1 ELSE 0 END) AS borderline_count,
      SUM(CASE WHEN Category = 'Abnormal' THEN 1 ELSE 0 END) AS abnormal_count
    FROM Sugar_Reading
    WHERE DateTime BETWEEN ? AND ?;
  `;
  db.query(readingsQuery, [periodStart, periodEnd], (err, results) => {
    if (err) return callback(err);
    readingStats = results[0];
    checkCompletion();
  });

  function checkCompletion() {
    queriesCompleted++;
    if (queriesCompleted === totalQueries) {
      // Merge patient reading stats into activePatients
      patientReadingStats.forEach(stat => {
        const patient = activePatients.find(p => p.id === stat.Patient_ID);
        if (patient) {
          patient.total_readings = stat.total_readings;
          patient.average_reading = stat.average_reading;
          patient.highest_reading = stat.highest_reading;
          patient.lowest_reading = stat.lowest_reading;
        }
      });
      buildAndSaveReport();
    }
  }
  
  function buildAndSaveReport() {
    // Build the detailed summary data object
    const summaryData = {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd
      },
      patients: {
        total_active: activePatients.length,
        list: activePatients
      },
      readings: {
        total: readingStats.total_readings,
        average: readingStats.avg_reading ? parseFloat(readingStats.avg_reading).toFixed(2) : 0,
        min: readingStats.min_reading,
        max: readingStats.max_reading,
        by_category: {
          normal: readingStats.normal_count,
          borderline: readingStats.borderline_count,
          abnormal: readingStats.abnormal_count
        }
      },
      aiInsights: aiInsights,
      generated_at: new Date().toISOString()
    };
    
    const summaryDataJSON = JSON.stringify(summaryData);

    const insertQuery = `
      INSERT INTO Report (Admin_ID, Period_Type, Period_Start, Period_End, Generated_At, Summary_Data)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    
    db.query(insertQuery, [adminId, periodType, periodStart, periodEnd, summaryDataJSON], (err, results) => {
      if (err) {
        console.error('Error saving report:', err);
        return callback(err);
      }
      
      const newReport = {
        report_id: results.insertId,
        admin_id: adminId,
        period_type: periodType,
        summary_data: summaryData
      };
      console.log(`New detailed report (ID: ${results.insertId}) generated by Admin ${adminId}.`);
      callback(null, newReport);
    });
  }
}

module.exports = {
  getReports,
  generateReport
};
