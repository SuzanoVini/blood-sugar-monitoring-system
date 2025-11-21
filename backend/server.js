try {
  // server.js - Blood Sugar Monitoring System Backend (Vinicius)

  const express = require('express');
  const mysql = require('mysql2');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const bcrypt = require('bcrypt');
  require('dotenv').config();
  const { verifyToken, requireRole } = require('./middleware/auth');
  const http = require('http'); // Required for Socket.IO
  const socketManager = require('./socketManager'); // Import Socket.IO Manager

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middleware Configuration
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Database Connection (DatabaseManager functionality from SDD)
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
      console.error('Please check that MySQL server is running and credentials are correct');
      process.exit(1);
    }
    console.log('Connected to MySQL database: blood_sugar_monitoring_system');
  });

  db.on('error', (err) => {
    console.error('Database error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Database connection lost. Attempting to reconnect...');
      db.connect();
    }
  });

  // Make database connection available to all route handlers
  app.locals.db = db;

  // Validate critical environment configuration for JWT
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Please set JWT_SECRET in your .env file.');
    process.exit(1);
  }

  // API Routes

  // Authentication Routes - Implemented by Sukhraj
  // Handles user login, logout, registration, and session management (SessionManager from SDD)
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes mounted at /api/auth');

  // Patient Routes - Implemented by Vinicius
  // Handles patient-specific operations including blood sugar readings,
  // AI suggestions, alerts, and data visualization
  const patientRoutes = require('./routes/patientRoutes');
  app.use('/api/patient', verifyToken, requireRole('Patient', 'Specialist', 'Clinic_Staff', 'Administrator'), patientRoutes);
  console.log('✓ Patient routes mounted at /api/patient');

  // Specialist Routes - Implemented by Vinicius
  // Handles specialist operations including viewing patient data,
  // providing feedback, and adjusting treatment plans
  const specialistRoutes = require('./routes/specialistRoutes');
  app.use('/api/specialist', verifyToken, requireRole('Specialist', 'Administrator'), specialistRoutes);
  console.log('✓ Specialist routes mounted at /api/specialist');

  // Admin Routes - Implemented by Krish
  // Handles administrator operations including user management,
  // report generation, and system statistics
  const adminRoutes = require('./routes/adminRoutes');
  app.use('/api/admin', verifyToken, requireRole('Administrator'), adminRoutes);
  console.log('✓ Admin routes mounted at /api/admin');

  // Staff Routes - Implemented by Vinicius
  // Handles clinic staff operations including threshold configuration
  // and read-only access to patient records
  const staffRoutes = require('./routes/staffRoutes');
  app.use('/api/staff', verifyToken, requireRole('Clinic_Staff', 'Administrator'), staffRoutes);
  console.log('✓ Staff routes mounted at /api/staff');

  // --- NEW ROUTES INTEGRATION ---

  const feedbackRoutes = require('./routes/feedbackRoutes');
  app.use('/api/feedback', verifyToken, requireRole('Specialist', 'Administrator', 'Patient'), feedbackRoutes);
  console.log('✓ Feedback routes mounted at /api/feedback');

  const roleManagementRoutes = require('./routes/roleManagementRoutes');
  app.use('/api/roles', verifyToken, requireRole('Administrator'), roleManagementRoutes);
  console.log('✓ Role Management routes mounted at /api/roles');

  const reportingRoutes = require('./routes/reportingRoutes');
  app.use('/api/reports', verifyToken, requireRole('Administrator'), reportingRoutes);
  console.log('✓ Reporting routes mounted at /api/reports');

  const thresholdRoutes = require('./routes/thresholdRoutes');
  app.use('/api/thresholds', verifyToken, requireRole('Clinic_Staff', 'Administrator'), thresholdRoutes);
  console.log('✓ Threshold routes mounted at /api/thresholds');

  const userProfileRoutes = require('./routes/userProfileRoutes');
  app.use('/api/user', verifyToken, userProfileRoutes); // Any authenticated user can manage their profile
  console.log('✓ User Profile routes mounted at /api/user');

  // --- END NEW ROUTES INTEGRATION ---


  // Error Handling Middleware

  // Handle 404 errors for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      path: req.path
    });
  });

  // Global error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // Server Startup
  const server = http.createServer(app); // Create HTTP server for Socket.IO
  server.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('Blood Sugar Monitoring System - Backend Server');
    console.log('='.repeat(50));
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`Database: blood_sugar_monitoring_system`);
    console.log(`CORS enabled for: http://localhost:3000`);
    console.log(`Started at: ${new Date().toLocaleString()}`);
    socketManager.init(server); // Initialize Socket.IO with the HTTP server
    console.log('✓ Socket.IO server initialized.');
    console.log('='.repeat(50) + '\n');
  });

  // Graceful shutdown handlers
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
} catch (err) {
  console.error('Unhandled exception:', err);
  process.exit(1);
}

