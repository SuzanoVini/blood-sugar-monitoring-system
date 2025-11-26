// src/components/ThresholdManager.tsx
// Author: Gemini
// Purpose: A UI component for viewing and updating system-wide blood sugar thresholds.

import React, { useState, useEffect } from 'react';
// Assuming an apiService file exists for making API calls, similar to other components.
import apiService from '../services/apiService'; 

// Matches the structure of the categorythreshold table
interface Thresholds {
  Normal_Low: number;
  Normal_High: number;
  Borderline_Low: number;
  Borderline_High: number;
  Abnormal_Low: number;
  Abnormal_High: number;
}

const ThresholdManager: React.FC = () => {
  const [thresholds, setThresholds] = useState<Partial<Thresholds>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch the current system thresholds when the component mounts
  useEffect(() => {
    const fetchThresholds = async () => {
      setLoading(true);
      setError(null);
      try {
        // This API endpoint will need to be created in the backend (e.g., GET /api/staff/thresholds)
        const response = await apiService.get('/thresholds'); // Corrected endpoint
        if (response.data && response.success) {
          setThresholds(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch thresholds.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching thresholds.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setThresholds(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // This API endpoint will need to be created in the backend (e.g., PUT /api/staff/thresholds)
      const response = await apiService.put('/thresholds', thresholds); // Corrected endpoint
      if (response.success) {
        setSuccess('Thresholds updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update thresholds.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating thresholds.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !Object.keys(thresholds).length) {
    return <div className="card"><p>Loading thresholds...</p></div>;
  }

  return (
    <section className="card">
      <div className="card-hd">
        <h4>System-Wide Thresholds</h4>
        <p>Configure the value ranges for blood sugar categories.</p>
      </div>
      <div className="card-bd">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <div className="form" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="input-group">
              <label htmlFor="Normal_Low">Normal (Low)</label>
              <input type="number" id="Normal_Low" name="Normal_Low" className="input" value={thresholds.Normal_Low || ''} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="Normal_High">Normal (High)</label>
              <input type="number" id="Normal_High" name="Normal_High" className="input" value={thresholds.Normal_High || ''} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="Borderline_Low">Borderline (Low)</label>
              <input type="number" id="Borderline_Low" name="Borderline_Low" className="input" value={thresholds.Borderline_Low || ''} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="Borderline_High">Borderline (High)</label>
              <input type="number" id="Borderline_High" name="Borderline_High" className="input" value={thresholds.Borderline_High || ''} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="Abnormal_Low">Abnormal (Low)</label>
              <input type="number" id="Abnormal_Low" name="Abnormal_Low" className="input" value={thresholds.Abnormal_Low || ''} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="Abnormal_High">Abnormal (High)</label>
              <input type="number" id="Abnormal_High" name="Abnormal_High" className="input" value={thresholds.Abnormal_High || ''} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-actions mt16">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Thresholds'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ThresholdManager;
