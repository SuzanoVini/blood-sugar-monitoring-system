// frontend/src/pages/ProfilePage.tsx
// Author: Gemini
// Purpose: A page for users to view and update their profile information.

import React, { useState, useEffect, FormEvent } from 'react';
import apiService from '../services/apiService'; 
import authService from '../services/authService';

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
}

const ProfilePage: React.FC = () => {
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
    if (profile.phone !== undefined) updateData.phone = profile.phone;

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

  if (loading && !profile.name) {
    return <div className="container"><p>Loading profile...</p></div>;
  }

  return (
    <div className="container">
      {/* Header with Page Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: '1rem',
        }}
      >
        <h2 className="page-title">My Profile</h2>
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <div className="card">
            <div className="card-bd">
              <form onSubmit={handleSubmit}>
                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}

                <div className="form-group">
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
                    style={{ width: '100%', padding: '10px', marginTop: '4px' }}
                  />
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
      </div>
    </div>
  );
};

export default ProfilePage;
