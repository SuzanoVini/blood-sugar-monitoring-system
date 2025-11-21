// api/authAPI.js
// Author: Vinicius Suzano
// Purpose: API functions for authentication operations including user registration,
//          login, logout, and profile retrieval

const bcrypt = require('bcrypt');
const crypto = require('crypto');

// bcrypt salt rounds for password hashing
const SALT_ROUNDS = 10;

/**
 * Register a new patient account
 * @param {Object} db - Database connection
 * @param {Object} userData - User registration data
 * @param {Function} callback - Callback function(err, result)
 */
function registerPatient(db, userData, callback) {
  const { name, email, password, phone, healthcareNumber, dateOfBirth, profileImage } = userData;

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
        INSERT INTO User (Name, Email, Password_Hash, Phone, Role, Status, Profile_Image, Created_At)
        VALUES (?, ?, ?, ?, 'Patient', 'Active', ?, NOW())
      `;

      const userValues = [name, email, passwordHash, phone || null, profileImage];

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
 * Create session record in SessionManager table
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {Date} expiresAt - Session expiry time
 * @param {Function} callback - Callback function(err, result)
 */
function createSession(db, userId, expiresAt, callback) {
  const query = `
    INSERT INTO SessionManager (Session_ID, User_ID, Login_Time, Expiry_Time)
    VALUES (UUID(), ?, NOW(), ?)
  `;

  db.query(query, [userId, expiresAt], (err, result) => {
    if (err) return callback(err, null);
    callback(null, { success: true, session_id: result.insertId });
  });
}

/**
 * Destroy session by setting expiry time to now
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {Function} callback - Callback function(err, result)
 */
function destroySession(db, userId, callback) {
  const query = `
    UPDATE SessionManager
    SET Expiry_Time = NOW()
    WHERE User_ID = ? AND (Expiry_Time IS NULL OR Expiry_Time > NOW())
  `;

  db.query(query, [userId], (err, result) => {
    if (err) return callback(err, null);
    callback(null, { success: true, rows_affected: result.affectedRows });
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

/**
 * Request password reset
 * @param {Object} db - Database connection
 * @param {string} email - User email
 * @param {Function} callback - Callback function(err, result)
 */
function forgotPassword(db, email, callback) {
  const findUserQuery = 'SELECT User_ID, Email FROM User WHERE Email = ?';
  db.query(findUserQuery, [email], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) {
      // Return generic success to prevent email enumeration
      return callback(null, { message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = results[0];
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token valid for 1 hour

    const updateTokenQuery = `
      UPDATE User
      SET Password_Reset_Token = ?, Password_Reset_Expires = ?
      WHERE User_ID = ?
    `;
    db.query(updateTokenQuery, [token, expires, user.User_ID], (err) => {
      if (err) return callback(err, null);

      // Simulate sending email by logging the reset link
      const resetLink = `http://localhost:3000/reset-password/${token}`;
      console.log(`Password Reset Link for ${user.Email}: ${resetLink}`);

      callback(null, { message: 'If an account with that email exists, a password reset link has been sent.' });
    });
  });
}

/**
 * Reset user password
 * @param {Object} db - Database connection
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password (plain text)
 * @param {Function} callback - Callback function(err, result)
 */
function resetPassword(db, token, newPassword, callback) {
  const findUserQuery = `
    SELECT User_ID, Password_Reset_Expires
    FROM User
    WHERE Password_Reset_Token = ? AND Password_Reset_Expires > NOW()
  `;
  db.query(findUserQuery, [token], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) {
      return callback(new Error('Invalid or expired password reset token.'), null);
    }

    const user = results[0];

    bcrypt.hash(newPassword, SALT_ROUNDS, (err, passwordHash) => {
      if (err) return callback(err, null);

      const updatePasswordQuery = `
        UPDATE User
        SET Password_Hash = ?, Password_Reset_Token = NULL, Password_Reset_Expires = NULL
        WHERE User_ID = ?
      `;
      db.query(updatePasswordQuery, [passwordHash, user.User_ID], (err) => {
        if (err) return callback(err, null);
        callback(null, { message: 'Password has been reset successfully.' });
      });
    });
  });
}


module.exports = {
  registerPatient,
  loginUser,
  getUserProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
  createSession,
  destroySession
};
