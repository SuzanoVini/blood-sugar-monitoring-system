// api/authAPI.js
// Author: Vinicius Suzano
// Purpose: API functions for authentication operations including user registration,
//          login, logout, and profile retrieval

const bcrypt = require('bcrypt');

// bcrypt salt rounds for password hashing
const SALT_ROUNDS = 10;

/**
 * Register a new patient account
 * @param {Object} db - Database connection
 * @param {Object} userData - User registration data
 * @param {Function} callback - Callback function(err, result)
 */
function registerPatient(db, userData, callback) {
  const { name, email, password, phone, healthcareNumber, dateOfBirth } = userData;

  // Check if email already exists
  const checkEmailQuery = 'SELECT User_ID FROM User WHERE Email = ?';

  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) return callback(err, null);

    if (results.length > 0) {
      return callback(new Error('Email already registered'), null);
    }

    // Hash the password
    bcrypt.hash(password, SALT_ROUNDS, (err, passwordHash) => {
      if (err) return callback(err, null);

      // Insert into User table
      const insertUserQuery = `
        INSERT INTO User (Name, Email, Password_Hash, Phone, Role, Status, Created_At)
        VALUES (?, ?, ?, ?, 'Patient', 'Active', NOW())
      `;

      const userValues = [name, email, passwordHash, phone || null];

      db.query(insertUserQuery, userValues, (err, userResult) => {
        if (err) return callback(err, null);

        const userId = userResult.insertId;

        // Insert into Patient table
        const insertPatientQuery = `
          INSERT INTO Patient (Patient_ID, Healthcare_Number, Date_Of_Birth)
          VALUES (?, ?, ?)
        `;

        const patientValues = [userId, healthcareNumber, dateOfBirth];

        db.query(insertPatientQuery, patientValues, (err, patientResult) => {
          if (err) {
            // Rollback: Delete the user record if patient insert fails
            db.query('DELETE FROM User WHERE User_ID = ?', [userId], (deleteErr) => {
              if (deleteErr) {
                if (process.env.NODE_ENV !== 'production') {
                  console.error('Error rolling back user creation:', deleteErr);
                }
              }
              return callback(err, null);
            });
            return;
          }

          // Return minimal profile (never return password hash)
          const profile = {
            User_ID: userId,
            Name: name,
            Email: email,
            Role: 'Patient',
            Status: 'Active'
          };

          if (process.env.NODE_ENV !== 'production') {
            console.log('New patient registered', { user_id: userId });
          }
          callback(null, profile);
        });
      });
    });
  });
}

/**
 * Login user with email and password
 * @param {Object} db - Database connection
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @param {Function} callback - Callback function(err, result)
 */
function loginUser(db, email, password, callback) {
  const query = `
    SELECT User_ID, Name, Email, Password_Hash, Role, Status
    FROM User
    WHERE Email = ?
  `;

  db.query(query, [email], (err, results) => {
    if (err) return callback(err, null);

    if (results.length === 0) {
      return callback(new Error('Invalid email or password'), null);
    }

    const user = results[0];

    // Check if account is active
    if (user.Status !== 'Active') {
      return callback(new Error('Account is not active'), null);
    }

    // Compare password with hash
    bcrypt.compare(password, user.Password_Hash, (err, isMatch) => {
      if (err) return callback(err, null);

      if (!isMatch) {
        return callback(new Error('Invalid email or password'), null);
      }

      // Return minimal profile (never return password hash)
      const profile = {
        User_ID: user.User_ID,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
        Status: user.Status
      };

      if (process.env.NODE_ENV !== 'production') {
        console.log('User login', { user_id: user.User_ID });
      }
      callback(null, profile);
    });
  });
}

/**
 * Get user profile by user ID
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {Function} callback - Callback function(err, result)
 */
function getUserProfile(db, userId, callback) {
  const query = `
    SELECT User_ID, Name, Email, Phone, Role, Status, Created_At
    FROM User
    WHERE User_ID = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return callback(err, null);

    if (results.length === 0) {
      return callback(new Error('User not found'), null);
    }

    const user = results[0];

    // Return profile (never return password hash)
    const profile = {
      User_ID: user.User_ID,
      Name: user.Name,
      Email: user.Email,
      Phone: user.Phone,
      Role: user.Role,
      Status: user.Status,
      Created_At: user.Created_At
    };

    callback(null, profile);
  });
}

/**
 * Logout user (stateless endpoint)
 * @param {Object} db - Database connection
 * @param {number} userId - User ID (for logging purposes)
 * @param {Function} callback - Callback function(err, result)
 */
function logoutUser(db, userId, callback) {
  // This is a stateless endpoint - no session management yet
  // Just log the logout event and return success
  if (process.env.NODE_ENV !== 'production') {
    console.log('User logout', { user_id: userId });
  }
  callback(null, { success: true, message: 'Logged out successfully' });
}

module.exports = {
  registerPatient,
  loginUser,
  getUserProfile,
  logoutUser
};
