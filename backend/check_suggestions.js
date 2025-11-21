// check_suggestions.js
const mysql = require('mysql2');
require('dotenv').config();

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
  console.log(`Checking suggestions for Patient ID: ${patientId}`);

  const query = `
    SELECT * FROM AI_Suggestion WHERE Patient_ID = ?;
  `;

  db.query(query, [patientId], (err, results) => {
    if (err) {
      console.error('Error fetching suggestions:', err);
    } else {
      console.log('--- Suggestions for Patient ID 1 ---');
      console.table(results);
    }
    db.end();
  });
});
