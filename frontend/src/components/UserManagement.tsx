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
    try {
      // These API endpoints need to be created and integrated on the backend.
      const [usersResponse, rolesResponse] = await Promise.all([
        apiService.get('/admin/users'), // Assumes a new endpoint to get all users
        apiService.get('/roles')         // Uses the existing endpoint to get roles
      ]);

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
      // Success, data is already updated in the UI
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
      // Revert the UI on failure
      setUsers(originalUsers);
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
