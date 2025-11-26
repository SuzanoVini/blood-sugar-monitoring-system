// frontend/src/components/CreateUserForm.tsx
// Author: Gemini
// Purpose: A form for administrators to create new Specialist and Clinic Staff accounts.

import React, { useState, FormEvent } from 'react';
import apiService from '../services/apiService';

type UserType = 'Specialist' | 'Clinic_Staff';

const CreateUserForm: React.FC = () => {
  const [userType, setUserType] = useState<UserType>('Specialist');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    workingId: '',
    specialization: '', // Specific to Specialist
    department: '',     // Specific to Clinic_Staff
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Allow only digits
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.phone && formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      setLoading(false);
      return;
    }

    const endpoint = userType === 'Specialist' ? '/admin/users/specialist' : '/admin/users/staff';
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      workingId: formData.workingId,
      ...(userType === 'Specialist' ? { specialization: formData.specialization } : { department: formData.department }),
    };

    console.log('[CreateUserForm] Submitting to endpoint:', endpoint, 'with payload:', payload); // Debugging

    try {
      const response = await apiService.post(endpoint, payload);
      console.log('[CreateUserForm] Success response:', response); // Debugging
      if (response.success) {
        setSuccess(`${userType.replace('_', ' ')} account created successfully!`);
        // Reset form
        setFormData({
          name: '', email: '', password: '', phone: '', workingId: '', specialization: '', department: ''
        });
      } else {
        throw new Error(response.message || `Failed to create ${userType} account.`);
      }
    } catch (err: any) {
      console.error('[CreateUserForm] Error in handleSubmit:', err); // Debugging
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-hd">
        <h4>Create New User Account</h4>
      </div>
      <div className="card-bd">
        <div className="user-type-toggle" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          <button onClick={() => setUserType('Specialist')} className={userType === 'Specialist' ? 'btn' : 'btn secondary'}>
            Create Specialist
          </button>
          <button onClick={() => setUserType('Clinic_Staff')} className={userType === 'Clinic_Staff' ? 'btn' : 'btn secondary'}>
            Create Clinic Staff
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {error && <div className="alert error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
          {success && <div className="alert success" style={{ gridColumn: '1 / -1' }}>{success}</div>}

          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" className="input" value={formData.name} onChange={handleChange} required style={{maxWidth: '425px'}} />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" className="input" value={formData.email} onChange={handleChange} required style={{maxWidth: '425px'}} />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" className="input" value={formData.password} onChange={handleChange} required minLength={6} style={{maxWidth: '425px'}} />
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleChange}
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              style={{ maxWidth: '425px' }}
            />
          </div>

          <div className="input-group">
            <label htmlFor="workingId">Working ID</label>
            <input type="text" id="workingId" name="workingId" className="input" value={formData.workingId} onChange={handleChange} required style={{maxWidth: '425px'}} />
          </div>

          {userType === 'Specialist' && (
            <div className="input-group">
              <label htmlFor="specialization">Specialization</label>
              <input type="text" id="specialization" name="specialization" className="input" value={formData.specialization} onChange={handleChange} required style={{maxWidth: '425px'}} />
            </div>
          )}

          {userType === 'Clinic_Staff' && (
            <div className="input-group">
              <label htmlFor="department">Department</label>
              <input type="text" id="department" name="department" className="input" value={formData.department} onChange={handleChange} required style={{maxWidth: '425px'}} />
            </div>
          )}

          <p style={{ gridColumn: '1 / -1' }}><small>Profile image upload is not supported in this form.</small></p>

          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Creating Account...' : `Create ${userType.replace('_', ' ')} Account`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserForm;
