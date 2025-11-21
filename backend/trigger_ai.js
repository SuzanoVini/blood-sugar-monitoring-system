// trigger_ai.js
const mysql = require('mysql2');
require('dotenv').config();
const aiProcessingAPI = require('./api/aiProcessingAPI');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blood_sugar_monitoring_system',
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL database.');

  const patientId = 1;
  console.log(`Triggering AI analysis for Patient ID: ${patientId}`);

  aiProcessingAPI.analyzeAndCreateSuggestions(db, patientId, (err, result) => {
    if (err) {
      console.error('Error during AI analysis:', err);
    } else {
      console.log('AI analysis completed successfully.');
      console.log('Result:', result);
    }
    db.end();
  });
});
