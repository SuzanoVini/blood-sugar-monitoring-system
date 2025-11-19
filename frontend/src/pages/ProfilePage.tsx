// frontend/src/pages/ProfilePage.tsx
// Author: Gemini
// Purpose: A page for users to view and update their profile information.

import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
// Assuming an apiService file exists for making API calls.
import apiService from '../services/apiService';
// Assuming an authService file exists for getting user info.
import authService from '../services/authService';

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // This endpoint will need to be created on the backend.
        const response = await apiService.get('/user/profile');
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch profile.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching your profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Prepare only the fields that can be updated.
    const updateData = {
      name: profile.name,
      phone: profile.phone
    };

    try {
      // This endpoint will need to be created on the backend.
      const response = await apiService.put('/user/profile', updateData);
      if (response.success) {
        setSuccess('Profile updated successfully!');
        // Optionally update user info in authService if it's cached there
        if (authService.updateCachedUser) {
          authService.updateCachedUser({ name: profile.name });
        }
      } else {
        throw new Error(response.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to the appropriate dashboard based on user role
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.role) {
      const normalizedRole = currentUser.role.toLowerCase().replace(/\s+/g, '_');
      const roleRoutes: { [key: string]: string } = {
        patient: '/dashboard',
        specialist: '/specialist',
        clinic_staff: '/staff',
        administrator: '/admin',
      };
      const route = roleRoutes[normalizedRole] || '/dashboard';
      navigate(route);
    } else {
      // Fallback to previous page
      navigate(-1);
    }
  };

  if (loading && !profile.name) {
    return <div className="container"><p>Loading profile...</p></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
        <button
          onClick={handleBack}
          className="btn secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px'
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h2 style={{ margin: 0 }}>My Profile</h2>
      </div>
      <div className="card">
        <div className="card-bd">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <div className="profile-image-section">
              <img 
                src={profile.profile_image || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                className="profile-image" 
              />
              {/* File upload functionality is complex and would be a separate feature */}
              <p><small>Profile image updates are not yet supported.</small></p>
            </div>

            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={profile.name || ''} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={profile.email || ''} 
                disabled // Email is typically not user-editable
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={profile.phone || ''} 
                onChange={handleChange} 
                placeholder="e.g., 555-123-4567"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
