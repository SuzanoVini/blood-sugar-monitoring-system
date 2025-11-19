// frontend/src/pages/PatientDetailsPage.tsx
// Author: Gemini
// Purpose: A detailed view of a single patient for a specialist.

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService';
import authService from '../services/authService';

// Re-usable components
import ReadingsList from '../components/ReadingsList';
import AISuggestions from '../components/AISuggestions';
import AlertNotification from '../components/AlertNotification';
import TrendsChart from '../components/TrendsChart';
import FeedbackForm from '../components/FeedbackForm';

// Interfaces
interface Reading {
  reading_id?: string | number;
  datetime: string;
  value: number;
}
interface User {
  name: string;
  email: string;
}

const PatientDetailsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<User | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [signal, setSignal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const loggedInUser = authService.getCurrentUser(); // Assuming this gets the logged-in user's info
  const specialistId = loggedInUser?.user_id;

  const patientIdNum = Number(patientId);

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided.");
      setLoading(false);
      return;
    }

    const loadPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
        // These API calls will need to be scoped to the patientId
        // Assuming apiService can be updated to support this
        const [patientDetails, patientReadings] = await Promise.all([
          apiService.get(`/specialist/patient/${patientId}`), // Endpoint to get patient details
          apiService.get(`/patient/readings?patient_id=${patientId}`)
        ]);

        if (patientDetails.success) {
          setPatient(patientDetails.data);
        } else {
          throw new Error(patientDetails.message || 'Failed to fetch patient details.');
        }

        if (patientReadings.success) {
          setReadings(patientReadings.data.readings);
        } else {
          throw new Error(patientReadings.message || 'Failed to fetch patient readings.');
        }

      } catch (err: any) {
        setError(err.message || "An error occurred while fetching patient data.");
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId, signal]);

  const refreshData = () => setSignal(s => s + 1);

  if (loading) {
    return <div className="container"><p>Loading patient data...</p></div>;
  }

  if (error) {
    return <div className="container"><div className="alert error">{error}</div></div>;
  }

  if (!patient) {
    return <div className="container"><p>Patient not found.</p></div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/specialist">&larr; Back to Specialist Dashboard</Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Patient: {patient.name}</h2>
        <p>Email: {patient.email}</p>
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          {specialistId && <FeedbackForm patientId={patientIdNum} specialistId={specialistId} onFeedbackSubmitted={refreshData} />}
          <AlertNotification />
          <AISuggestions refreshSignal={signal} />
        </div>
        <div className="stack">
          <TrendsChart readings={readings} />
          <ReadingsList refreshSignal={signal} />
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsPage;
