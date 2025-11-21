// api/userProfileAPI.js
// Author: Gemini
// Purpose: API functions for managing user profile information.

/**
 * Retrieves a user's profile information.
 * @param {Object} db - Database connection
 * @param {number} userId - The ID of the user whose profile to retrieve.
 * @param {Function} callback - Callback function(err, profile)
 */
function getUserProfile(db, userId, callback) {
  const query = `
    SELECT Name, Email, Phone, Profile_Image AS profile_image
    FROM User
    WHERE User_ID = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(`Error fetching profile for User ${userId}:`, err);
      return callback(err, null);
    }
    if (results.length === 0) {
      return callback(null, null); // User not found
    }
    callback(null, results[0]);
  });
}

/**
 * Updates a user's profile information.
 * Currently supports updating Name and Phone.
 * @param {Object} db - Database connection
 * @param {number} userId - The ID of the user whose profile to update.
 * @param {Object} updateData - An object containing fields to update (e.g., { name: 'New Name', phone: '123-456-7890' }).
 * @param {Function} callback - Callback function(err, result)
 */
function updateUserProfile(db, userId, updateData, callback) {
  console.log(`[DEBUG] Attempting to update profile for userId: ${userId}`);
  console.log('[DEBUG] Update data received:', updateData);

  const updateFields = [];
  const queryParams = [];

  if (updateData.name !== undefined && updateData.name !== null) {
    updateFields.push('Name = ?');
    queryParams.push(updateData.name);
  }
  if (updateData.phone !== undefined) { // Allow empty string for phone
    updateFields.push('Phone = ?');
    queryParams.push(updateData.phone);
  }
  if (updateData.profileImage !== undefined) {
    updateFields.push('Profile_Image = ?');
    queryParams.push(updateData.profileImage);
  }
  // Profile_Image updates would involve file uploads and separate logic.

  if (updateFields.length === 0) {
    return callback(null, { success: false, message: 'No fields provided for update' });
  }

  queryParams.push(userId); // Add userId for the WHERE clause

  const query = `
    UPDATE User
    SET ${updateFields.join(', ')}
    WHERE User_ID = ?
  `;
  
  console.log('[DEBUG] Executing SQL query:', query);
  console.log('[DEBUG] With query params:', queryParams);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error(`Error updating profile for User ${userId}:`, err);
      return callback(err, null);
    }
    
    console.log('[DEBUG] Database update result:', results);

    if (results.affectedRows === 0) {
      return callback(null, { success: false, message: 'User not found or no changes made' });
    }
    console.log(`User ${userId} profile updated.`);
    callback(null, { success: true, user_id: userId, affectedRows: results.affectedRows });
  });
}

module.exports = {
  getUserProfile,
  updateUserProfile
};
