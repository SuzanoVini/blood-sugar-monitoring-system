// server.js - Blood Sugar Monitoring System Backend

// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ============================================
// EXPRESS APP INITIALIZATION
// ============================================
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Enable CORS for React frontend running on localhost:3000
// This allows the frontend to make requests to this backend server
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Parse incoming JSON request bodies
app.use(bodyParser.json());

// Parse URL-encoded request bodies (for form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware for debugging and monitoring
// Logs timestamp, HTTP method, and requested path for each incoming request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================

// Create MySQL connection using environment variables or default values
// The connection details are stored in .env file for security
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blood_sugar_monitoring_system',
  port: process.env.DB_PORT || 3306
});

// Attempt to connect to the database
// If connection fails, log error details and exit the process
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    console.error('Please check that MySQL server is running and credentials are correct');
    process.exit(1);
  }
  console.log('Connected to MySQL database: blood_sugar_monitoring_system');
});

// Handle database connection errors that occur after initial connection
// This includes connection timeouts and disconnections
db.on('error', (err) => {
  console.error('Database error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection lost. Attempting to reconnect...');
    db.connect();
  }
});

// Make database connection available to all route handlers
// Routes can access this via req.app.locals.db
app.locals.db = db;

// ============================================
// TEST ROUTES
// ============================================

// Root endpoint - provides API information and available endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Blood Sugar Monitoring System API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth/*',
      patient: '/api/patient/*',
      specialist: '/api/specialist/*',
      admin: '/api/admin/*',
      staff: '/api/staff/*'
    }
  });
});

// Health check endpoint - verifies database connection is active
// Returns error if database query fails, success if query executes
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err, results) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: err.message
      });
    }
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });
});

// Test endpoint - queries database to count total users
// Useful for verifying that database connection and queries work correctly
app.get('/api/test', (req, res) => {
  db.query('SELECT COUNT(*) as userCount FROM user', (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database query failed',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      message: 'Database connection working',
      data: {
        totalUsers: results[0].userCount,
        timestamp: new Date().toISOString()
      }
    });
  });
});

// Debug endpoint - retrieves all users from database
// Shows user details without sensitive information like password hashes
// This endpoint should be removed or restricted in production
app.get('/api/test/users', (req, res) => {
  const query = `
    SELECT User_ID, Name, Email, Role, Status, Created_At 
    FROM user 
    ORDER BY User_ID
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Query failed',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      count: results.length,
      users: results
    });
  });
});

// Debug endpoint - retrieves sample blood sugar readings with Event field
// Demonstrates that Event field from instructor feedback is working correctly
// Shows reading details along with patient names through JOIN operation
app.get('/api/test/readings', (req, res) => {
  const query = `
    SELECT r.Reading_ID, r.Value, r.Category, r.Event, r.DateTime,
           u.Name as Patient_Name
    FROM sugar_reading r
    JOIN patient p ON r.Patient_ID = p.Patient_ID
    JOIN user u ON p.Patient_ID = u.User_ID
    ORDER BY r.DateTime DESC
    LIMIT 10
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Query failed',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      message: 'Sample readings with Event field',
      count: results.length,
      readings: results
    });
  });
});

// ============================================
// API ROUTES - TO BE IMPLEMENTED
// ============================================

// Authentication Routes - Implemented by Sukhraj
// Handles user login, logout, registration, and session management
// Uncomment when authRoutes.js is ready
// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);

// Patient Routes - Implemented by Vinicius
// Handles patient-specific operations including blood sugar readings,
// AI suggestions, alerts, and data visualization
// Uncomment when patientRoutes.js is ready
// const patientRoutes = require('./routes/patientRoutes');
// app.use('/api/patient', patientRoutes);

// Specialist Routes - Implemented by Vinicius
// Handles specialist operations including viewing patient data,
// providing feedback, and adjusting treatment plans
// Uncomment when specialistRoutes.js is ready
// const specialistRoutes = require('./routes/specialistRoutes');
// app.use('/api/specialist', specialistRoutes);

// Admin Routes - Implemented by Krish
// Handles administrator operations including user management,
// report generation, and system statistics
// Uncomment when adminRoutes.js is ready
// const adminRoutes = require('./routes/adminRoutes');
// app.use('/api/admin', adminRoutes);

// Staff Routes - To be implemented
// Handles clinic staff operations including threshold configuration
// and read-only access to patient records
// Uncomment when staffRoutes.js is ready
// const staffRoutes = require('./routes/staffRoutes');
// app.use('/api/staff', staffRoutes);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// Handle 404 errors for undefined routes
// Returns list of available endpoints to help with debugging
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/test',
      'GET /api/test/users',
      'GET /api/test/readings'
    ]
  });
});

// Global error handling middleware
// Catches any unhandled errors and returns appropriate response
// In development mode, includes stack trace for debugging
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('Blood Sugar Monitoring System - Backend Server');
  console.log('='.repeat(50));
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Database: blood_sugar_monitoring_system`);
  console.log(`CORS enabled for: http://localhost:3000`);
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
  console.log('\nAvailable Test Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   GET  http://localhost:${PORT}/api/test/users`);
  console.log(`   GET  http://localhost:${PORT}/api/test/readings`);
  console.log('\nServer is ready to accept requests\n');
});

// Handle graceful shutdown on SIGTERM signal
// Closes database connection before exiting to prevent data corruption
process.on('SIGTERM', () => {
  console.log('\nSIGTERM signal received: closing HTTP server');
  db.end((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

// Handle graceful shutdown on SIGINT signal (Ctrl+C)
// Ensures clean shutdown when user stops server manually
process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  db.end((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});