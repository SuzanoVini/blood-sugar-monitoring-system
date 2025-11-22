// api/userProfileAPI.js
// Purpose: API functions for managing user profile information.

/**
 * Retrieves a user's profile information including role-specific fields.
 * @param {Object} db - Database connection
 * @param {number} userId - The ID of the user whose profile to retrieve.
 * @param {Function} callback - Callback function(err, profile)
 */
function getUserProfile(db, userId, callback) {
  // First get user basic info and role
  const userQuery = `
    SELECT User_ID, Name, Email, Phone, Profile_Image AS profile_image, Role
    FROM User
    WHERE User_ID = ?
  `;

  db.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error(`Error fetching profile for User ${userId}:`, err);
      return callback(err, null);
    }
    if (results.length === 0) {
      return callback(null, null); // User not found
    }

    const userProfile = results[0];
    const role = userProfile.Role;

    // Fetch role-specific data based on role
    if (role === 'Patient') {
      const patientQuery = `SELECT Healthcare_Number, Date_Of_Birth FROM Patient WHERE Patient_ID = ?`;
      db.query(patientQuery, [userId], (err, patientResults) => {
        if (err) {
          console.error(`Error fetching patient data for User ${userId}:`, err);
          return callback(err, null);
        }
        if (patientResults.length > 0) {
          userProfile.healthcareNumber = patientResults[0].Healthcare_Number;
          userProfile.dateOfBirth = patientResults[0].Date_Of_Birth;
        }
        callback(null, userProfile);
      });
    } else if (role === 'Specialist') {
      const specialistQuery = `SELECT Working_ID, Specialization FROM Specialist WHERE Specialist_ID = ?`;
      db.query(specialistQuery, [userId], (err, specialistResults) => {
        if (err) {
          console.error(`Error fetching specialist data for User ${userId}:`, err);
          return callback(err, null);
        }
        if (specialistResults.length > 0) {
          userProfile.workingId = specialistResults[0].Working_ID;
          userProfile.specialization = specialistResults[0].Specialization;
        }
        callback(null, userProfile);
      });
    } else if (role === 'Clinic_Staff') {
      const staffQuery = `SELECT Working_ID, Department FROM Clinic_Staff WHERE Staff_ID = ?`;
      db.query(staffQuery, [userId], (err, staffResults) => {
        if (err) {
          console.error(`Error fetching clinic staff data for User ${userId}:`, err);
          return callback(err, null);
        }
        if (staffResults.length > 0) {
          userProfile.workingId = staffResults[0].Working_ID;
          userProfile.department = staffResults[0].Department;
        }
        callback(null, userProfile);
      });
    } else {
      // Administrator or other roles - no additional data
      callback(null, userProfile);
    }
  });
}

/**
 * Updates a user's profile information including role-specific fields.
 * @param {Object} db - Database connection
 * @param {number} userId - The ID of the user whose profile to update.
 * @param {string} userRole - The role of the user (Patient, Specialist, Clinic_Staff, Administrator).
 * @param {Object} updateData - An object containing fields to update.
 * @param {Function} callback - Callback function(err, result)
 */
function updateUserProfile(db, userId, userRole, updateData, callback) {
  console.log(`[DEBUG] Attempting to update profile for userId: ${userId}, role: ${userRole}`);
  console.log('[DEBUG] Update data received:', updateData);

  // Update User table fields
  const updateFields = [];
  const queryParams = [];

  if (updateData.name !== undefined && updateData.name !== null) {
    updateFields.push('Name = ?');
    queryParams.push(updateData.name);
  }
  if (updateData.phone !== undefined) {
    updateFields.push('Phone = ?');
    queryParams.push(updateData.phone);
  }
  if (updateData.profileImage !== undefined) {
    updateFields.push('Profile_Image = ?');
    queryParams.push(updateData.profileImage);
  }

  // Execute User table update if there are fields to update
  const updateUserTable = (continueCallback) => {
    if (updateFields.length === 0) {
      return continueCallback();
    }

    queryParams.push(userId);
    const query = `UPDATE User SET ${updateFields.join(', ')} WHERE User_ID = ?`;

    console.log('[DEBUG] Executing User table update:', query);
    console.log('[DEBUG] With query params:', queryParams);

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error(`Error updating User table for userId ${userId}:`, err);
        return callback(err, null);
      }
      console.log('[DEBUG] User table update result:', results);
      continueCallback();
    });
  };

  // Update role-specific table
  const updateRoleSpecificTable = () => {
    let roleQuery = null;
    let roleParams = [];

    if (userRole === 'Patient') {
      const roleFields = [];
      if (updateData.healthcareNumber !== undefined) {
        roleFields.push('Healthcare_Number = ?');
        roleParams.push(updateData.healthcareNumber);
      }
      if (updateData.dateOfBirth !== undefined) {
        roleFields.push('Date_Of_Birth = ?');
        roleParams.push(updateData.dateOfBirth);
      }
      if (roleFields.length > 0) {
        roleParams.push(userId);
        roleQuery = `UPDATE Patient SET ${roleFields.join(', ')} WHERE Patient_ID = ?`;
      }
    } else if (userRole === 'Specialist') {
      const roleFields = [];
      if (updateData.workingId !== undefined) {
        roleFields.push('Working_ID = ?');
        roleParams.push(updateData.workingId);
      }
      if (updateData.specialization !== undefined) {
        roleFields.push('Specialization = ?');
        roleParams.push(updateData.specialization);
      }
      if (roleFields.length > 0) {
        roleParams.push(userId);
        roleQuery = `UPDATE Specialist SET ${roleFields.join(', ')} WHERE Specialist_ID = ?`;
      }
    } else if (userRole === 'Clinic_Staff') {
      const roleFields = [];
      if (updateData.workingId !== undefined) {
        roleFields.push('Working_ID = ?');
        roleParams.push(updateData.workingId);
      }
      if (updateData.department !== undefined) {
        roleFields.push('Department = ?');
        roleParams.push(updateData.department);
      }
      if (roleFields.length > 0) {
        roleParams.push(userId);
        roleQuery = `UPDATE Clinic_Staff SET ${roleFields.join(', ')} WHERE Staff_ID = ?`;
      }
    }

    if (roleQuery) {
      console.log('[DEBUG] Executing role-specific update:', roleQuery);
      console.log('[DEBUG] With role params:', roleParams);

      db.query(roleQuery, roleParams, (err, results) => {
        if (err) {
          console.error(`Error updating role-specific table for userId ${userId}:`, err);
          return callback(err, null);
        }
        console.log('[DEBUG] Role-specific table update result:', results);
        console.log(`User ${userId} profile updated successfully.`);
        callback(null, { success: true, user_id: userId });
      });
    } else {
      // No role-specific updates
      console.log(`User ${userId} profile updated successfully (no role-specific changes).`);
      callback(null, { success: true, user_id: userId });
    }
  };

  // Check if any fields were provided
  const hasUserFields = updateFields.length > 0;
  const hasRoleFields =
    (userRole === 'Patient' && (updateData.healthcareNumber !== undefined || updateData.dateOfBirth !== undefined)) ||
    (userRole === 'Specialist' && (updateData.workingId !== undefined || updateData.specialization !== undefined)) ||
    (userRole === 'Clinic_Staff' && (updateData.workingId !== undefined || updateData.department !== undefined));

  if (!hasUserFields && !hasRoleFields) {
    return callback(null, { success: false, message: 'No fields provided for update' });
  }

  // Execute updates sequentially
  updateUserTable(() => {
    updateRoleSpecificTable();
  });
}

module.exports = {
  getUserProfile,
  updateUserProfile
};
