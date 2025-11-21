// frontend/src/components/UserManagement.tsx
// Author: Gemini
// Purpose: A component for administrators to view and manage user roles.

import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface User {
  User_ID: number;
  Name: string;
  Email: string;
  Role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    console.log('[UserManagement] Fetching data...'); // Debugging
    try {
      // These API endpoints need to be created and integrated on the backend.
      const [usersResponse, rolesResponse] = await Promise.all([
        apiService.get('/admin/users'), // Assumes a new endpoint to get all users
        apiService.get('/roles')         // Uses the existing endpoint to get roles
      ]);

      console.log('[UserManagement] Raw users response:', usersResponse); // Debugging
      console.log('[UserManagement] Raw roles response:', rolesResponse); // Debugging

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      } else {
        throw new Error(usersResponse.message || 'Failed to fetch users.');
      }

      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data);
      } else {
        throw new Error(rolesResponse.message || 'Failed to fetch roles.');
      }

    } catch (err: any) {
      console.error('[UserManagement] Error in fetchData:', err); // Debugging
      setError(err.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    // Optimistically update the UI, but store the original role in case of failure
    const originalUsers = [...users];
    setUsers(users.map(u => u.User_ID === userId ? { ...u, Role: newRole } : u));

    try {
      // Uses the PUT /api/roles/user/:userId endpoint
      const response = await apiService.put(`/roles/user/${userId}`, { newRole });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update role.');
      }
      alert(`Role for user ${userId} updated to ${newRole} successfully!`);
      // Success, data is already updated in the UI
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
      // Revert the UI on failure
      setUsers(originalUsers);
    }
  };

  const handleDelete = async (userId: number, userName: string) => {
    if (window.confirm(`Are you sure you want to delete the user "${userName}" (ID: ${userId})? This action cannot be undone.`)) {
      try {
        const response = await apiService.delete(`/admin/users/${userId}`);
        if (response.success) {
          alert(`User ${userName} deleted successfully.`);
          setUsers(users.filter(u => u.User_ID !== userId)); // Remove user from state
        } else {
          throw new Error(response.message || 'Failed to delete user.');
        }
      } catch (err: any) {
        alert(`Error deleting user: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div className="card"><p>Loading user data...</p></div>;
  }

  if (error) {
    return <div className="card"><div className="alert error">{error}</div></div>;
  }

  return (
    <div className="card">
      <div className="card-hd">
        <h4>User Role Management</h4>
      </div>
      <div className="card-bd">
        <table className="user-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.User_ID}>
                <td>{user.User_ID}</td>
                <td>{user.Name}</td>
                <td>{user.Email}</td>
                <td>
                  <select
                    value={user.Role}
                    onChange={(e) => handleRoleChange(user.User_ID, e.target.value)}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(user.User_ID, user.Name)}
                    className="btn secondary"
                    style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--danger)'}}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
