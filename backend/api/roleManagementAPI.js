// api/roleManagementAPI.js
// Author: Gemini
// Purpose: API functions for managing user roles, primarily for administrators.

/**
 * Retrieves a list of all available user roles defined in the system.
 * In a real-world scenario, roles might be dynamic or configured elsewhere.
 * For this project, we'll derive them from the User table's ENUM definition.
 * @param {Object} db - Database connection (unused for static list, but kept for consistency)
 * @param {Function} callback - Callback function(err, roles)
 */
function getAllRoles(db, callback) {
  // Directly provide the ENUM values based on the 'Role' column in the 'User' table schema
  const roles = ['Patient', 'Specialist', 'Clinic_Staff', 'Administrator'];
  process.nextTick(() => callback(null, roles)); // Use nextTick to simulate async DB call
}

/**
 * Updates the role of a specific user.
 * @param {Object} db - Database connection
 * @param {number} userId - The ID of the user whose role is to be updated.
 * @param {string} newRole - The new role to assign to the user.
 * @param {Function} callback - Callback function(err, result)
 */
function updateUserRole(db, userId, newRole, callback) {
  // First, validate the newRole against allowed roles
  getAllRoles(db, (err, allowedRoles) => {
    if (err) return callback(err);

    if (!allowedRoles.includes(newRole)) {
      return callback(new Error(`Invalid role: ${newRole}`), null);
    }

    const query = `
      UPDATE User
      SET Role = ?
      WHERE User_ID = ?
    `;

    db.query(query, [newRole, userId], (err, results) => {
      if (err) {
        console.error(`Error updating role for User ${userId}:`, err);
        return callback(err, null);
      }

      if (results.affectedRows === 0) {
        return callback(null, { success: false, message: 'User not found or role already set' });
      }

      console.log(`User ${userId} role updated to ${newRole}.`);
      callback(null, { success: true, user_id: userId, new_role: newRole });
    });
  });
}

module.exports = {
  getAllRoles,
  updateUserRole
};
