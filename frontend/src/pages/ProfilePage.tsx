// frontend/src/pages/ProfilePage.tsx
// Author: Gemini
// Purpose: A page for users to view and update their profile information.

import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const updateData: { name?: string; phone?: string | null; } = {};
    if (profile.name !== undefined) updateData.name = profile.name;
    if (profile.phone !== undefined) {
      if (profile.phone && (profile.phone.length !== 10 || !/^\d{10}$/.test(profile.phone))) {
        setError("Phone number must be exactly 10 digits.");
        setLoading(false);
        return;
      }
      updateData.phone = profile.phone;
    }

    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profileImage', selectedFile);
        if (updateData.name) formData.append('name', updateData.name);
        if (updateData.phone) formData.append('phone', updateData.phone);

        response = await apiService.put('/user/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await apiService.put('/user/profile', updateData);
      }

      if (response.success) {
        setSuccess('Profile updated successfully!');
        setSelectedFile(null); // Clear selected file after successful upload
        // Refetch profile to display new image if updated
        const updatedProfileResponse = await apiService.get('/user/profile');
        if (updatedProfileResponse.success && updatedProfileResponse.data) {
          setProfile(updatedProfileResponse.data);
        }
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

  const currentProfileImage = selectedFile
    ? URL.createObjectURL(selectedFile)
    : (profile.profile_image ? `http://localhost:5000/${profile.profile_image}` : null);

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

      <div className="dashboard-grid">
        <div className="stack">
          <div className="card">
            <div className="card-bd">
              <form onSubmit={handleSubmit} className="form full">
                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}

                <div className="input-group">
                  <label>Profile Image</label>
                  <div style={{ marginBottom: '10px' }}>
                    {currentProfileImage ? (
                      <img
                        src={currentProfileImage}
                        alt="Profile"
                        style={{ width: '200px', height: '200px', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        width: '200px',
                        height: '200px',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#aaa',
                        border: '1px solid #ccc',
                        marginBottom: '10px'
                      }}>
                        No Image
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input"
                    value={profile.name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input"
                    value={profile.email || ''}
                    disabled // Email is typically not user-editable
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="input"
                    value={profile.phone || ''}
                    onChange={handleChange}
                    placeholder="e.g., 5551234567"
                    minLength={10}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    style={{maxWidth: '425px'}}
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
      </div>
    </div>
  );
};

export default ProfilePage;
