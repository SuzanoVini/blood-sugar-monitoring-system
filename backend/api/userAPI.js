// ===============================================
// File: api/userAPI.js
// Author: Manan Chopra
// Purpose: Handle patient registration, login, profile management,
//          and admin-level user operations (create/delete users).

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// 1️ Register new patient account
function registerPatient(db, healthcare_number, name, email, password, phone, dob, callback) {
  bcrypt.hash(password, SALT_ROUNDS, (err, passwordHash) => {
    if (err) return callback(err);

    const userQuery = `
      INSERT INTO User (Name, Email, Password_Hash, Phone, Role, Status)
      VALUES (?, ?, ?, ?, 'Patient', 'Active');
    `;
    const userValues = [name, email, passwordHash, phone];

    db.query(userQuery, userValues, (err, userResult) => {
      if (err) return callback(err);

      const userId = userResult.insertId;
      const patientQuery = `
        INSERT INTO Patient (Patient_ID, Healthcare_Number, Date_Of_Birth)
        VALUES (?, ?, ?);
      `;
      db.query(patientQuery, [userId, healthcare_number, dob], (err, patientResult) => {
        if (err) {
          db.query('DELETE FROM User WHERE User_ID = ?', [userId]);
          return callback(err);
        }
        callback(null, { userId });
      });
    });
  });
}

// 2️ User login (all user types)
function loginUser(db, email, password, callback) {
  const query = 'SELECT * FROM User WHERE Email = ?';
  db.query(query, [email], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(new Error('User not found'));

    const user = results[0];
    bcrypt.compare(password, user.Password_Hash, (err, match) => {
      if (err) return callback(err);
      if (!match) return callback(new Error('Invalid password'));
      callback(null, { userId: user.User_ID, role: user.Role, name: user.Name });
    });
  });
}

// 3️ Get user profile by ID
function getUserProfile(db, userId, callback) {
  const baseQuery = 'SELECT * FROM User WHERE User_ID = ?';
  db.query(baseQuery, [userId], (err, userResults) => {
    if (err || userResults.length === 0) return callback(err || new Error('User not found'));
    const user = userResults[0];

    let roleQuery = '';
    switch (user.Role) {
      case 'Patient':
        roleQuery = 'SELECT * FROM Patient WHERE Patient_ID = ?';
        break;
      case 'Specialist':
        roleQuery = 'SELECT * FROM Specialist WHERE Specialist_ID = ?';
        break;
      case 'Clinic_Staff':
        roleQuery = 'SELECT * FROM Clinic_Staff WHERE Staff_ID = ?';
        break;
      case 'Administrator':
        roleQuery = 'SELECT * FROM Administrator WHERE Admin_ID = ?';
        break;
      default:
        return callback(new Error('Unknown role'));
    }

    db.query(roleQuery, [userId], (err, roleResults) => {
      if (err) return callback(err);
      callback(null, { ...user, roleData: roleResults[0] });
    });
  });
}

// 4️ Update user profile
function updateUserProfile(db, userId, updates, callback) {
  const { name, email, phone, profile_image } = updates;
  const query = `
    UPDATE User SET Name = ?, Email = ?, Phone = ?, Profile_Image = ?
    WHERE User_ID = ?;
  `;
  db.query(query, [name, email, phone, profile_image, userId], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Email')) {
        return callback(new Error('Email already registered'));
      }
      return callback(err);
    }
    callback(null, { updated: true });
  });
}

// 5️ Create specialist account (admin only)
function createSpecialist(db, name, email, password, workingId, specialization, callback) {
  const userData = { name, email, password, workingId, specialization };
  const adminAPI = require('./adminAPI');
  adminAPI.createSpecialist(db, userData, callback);
}

// 6️ Create staff account (admin only)
function createStaff(db, name, email, password, workingId, department, callback) {
  const userData = { name, email, password, workingId, department };
  const adminAPI = require('./adminAPI');
  adminAPI.createStaff(db, userData, callback);
}

// 7️ Delete user account (admin only)
function deleteUser(db, userId, callback) {
  const adminAPI = require('./adminAPI');
  adminAPI.deleteUser(db, userId, callback);
}

// 8️ Get all users by role (for admin dashboard)
function getUsersByRole(db, role, callback) {
  const query = `
    SELECT u.User_ID, u.Name, u.Email, u.Phone, u.Status, r.*
    FROM User u
    JOIN ${role === 'Patient' ? 'Patient' : role === 'Specialist' ? 'Specialist' : role === 'Clinic_Staff' ? 'Clinic_Staff' : 'Administrator'} r
    ON u.User_ID = r.${role === 'Patient' ? 'Patient_ID' : role === 'Specialist' ? 'Specialist_ID' : role === 'Clinic_Staff' ? 'Staff_ID' : 'Admin_ID'}
    WHERE u.Role = ?
    ORDER BY u.Name;
  `;
  db.query(query, [role], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

// Export all user functions
module.exports = {
  registerPatient,
  loginUser,
  getUserProfile,
  updateUserProfile,
  createSpecialist,
  createStaff,
  deleteUser,
  getUsersByRole
};