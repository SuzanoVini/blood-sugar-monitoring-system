// ===============================================
// File: AdminDashboard.jsx
// Author: Manan Chopra
// Purpose: Admin interface for user management, system stats, and report generation

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [stats, setStats] = useState({});
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({});
  const [reportParams, setReportParams] = useState({
    type: 'Monthly',
    start: '',
    end: ''
  });

  // Fetch all users
  useEffect(() => {
    axios.get('/api/admin/getAllUsers')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  // Fetch system stats
  useEffect(() => {
    axios.get('/api/admin/getSystemStats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  // Filter users by role
  const filteredUsers = roleFilter === 'All'
    ? users
    : users.filter(user => user.Role === roleFilter);

  // Handle form input
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Create specialist
  const createSpecialist = () => {
    axios.post('/api/admin/createSpecialist', formData)
      .then(res => alert('Specialist created'))
      .catch(err => alert(err.response.data.message));
  };

  // Create staff
  const createStaff = () => {
    axios.post('/api/admin/createStaff', formData)
      .then(res => alert('Staff created'))
      .catch(err => alert(err.response.data.message));
  };

  // Delete user
  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      axios.delete(`/api/admin/deleteUser/${userId}`)
        .then(res => alert('User deleted'))
        .catch(err => alert(err.response.data.message));
    }
  };

  // Generate report
  const generateReport = () => {
    axios.post('/api/admin/generateReport', reportParams)
      .then(res => setReport(res.data))
      .catch(err => alert(err.response.data.message));
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* User Management Section */}
      <section>
        <h2>User Management</h2>
        <label>Filter by Role:</label>
        <select onChange={(e) => setRoleFilter(e.target.value)}>
          <option>All</option>
          <option>Patient</option>
          <option>Specialist</option>
          <option>Clinic_Staff</option>
        </select>

        <ul>
          {filteredUsers.map(user => (
            <li key={user.User_ID}>
              {user.Name} ({user.Role}) - {user.Email}
              <button onClick={() => deleteUser(user.User_ID)}>Delete</button>
            </li>
          ))}
        </ul>

        <h3>Create Specialist</h3>
        <input name="name" placeholder="Name" onChange={handleInputChange} />
        <input name="email" placeholder="Email" onChange={handleInputChange} />
        <input name="password" placeholder="Password" type="password" onChange={handleInputChange} />
        <input name="workingId" placeholder="Working ID" onChange={handleInputChange} />
        <input name="specialization" placeholder="Specialization" onChange={handleInputChange} />
        <button onClick={createSpecialist}>Create Specialist</button>

        <h3>Create Staff</h3>
        <input name="name" placeholder="Name" onChange={handleInputChange} />
        <input name="email" placeholder="Email" onChange={handleInputChange} />
        <input name="password" placeholder="Password" type="password" onChange={handleInputChange} />
        <input name="workingId" placeholder="Working ID" onChange={handleInputChange} />
        <input name="department" placeholder="Department" onChange={handleInputChange} />
        <button onClick={createStaff}>Create Staff</button>
      </section>

      {/* Report Generation Section */}
      <section>
        <h2>Report Generation</h2>
        <select onChange={(e) => setReportParams({ ...reportParams, type: e.target.value })}>
          <option>Monthly</option>
          <option>Yearly</option>
        </select>
        <input type="date" onChange={(e) => setReportParams({ ...reportParams, start: e.target.value })} />
        <input type="date" onChange={(e) => setReportParams({ ...reportParams, end: e.target.value })} />
        <button onClick={generateReport}>Generate Report</button>

        {report && (
          <div>
            <h3>Report Summary</h3>
            <p>Total Active Patients: {report.total_active_patients}</p>
            <ul>
              {report.patient_stats.map((p, i) => (
                <li key={i}>
                  {p.name}: Avg {p.avg}, Max {p.max}, Min {p.min}
                </li>
              ))}
            </ul>
            <h4>Top Triggers</h4>
            <ul>
              {report.top_triggers.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* System Statistics Section */}
      <section>
        <h2>System Statistics</h2>
        <ul>
          <li>Total Patients: {stats.Patient || 0}</li>
          <li>Total Specialists: {stats.Specialist || 0}</li>
          <li>Total Staff: {stats.Clinic_Staff || 0}</li>
          <li>Readings This Month: {stats.total_readings_this_month || 0}</li>
        </ul>
      </section>
    </div>
  );
}

export default AdminDashboard;