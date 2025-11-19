// frontend/src/components/PatientFeedbackList.tsx
// Author: Gemini
// Purpose: Displays a list of feedback received by a patient from specialists.

import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface FeedbackItem {
  Feedback_ID: number;
  Specialist_ID: number;
  Specialist_Name: string;
  Content: string;
  Created_At: string;
}

interface PatientFeedbackListProps {
  patientId: number;
  refreshSignal?: number; // Optional prop to trigger a refresh
}

const PatientFeedbackList: React.FC<PatientFeedbackListProps> = ({ patientId, refreshSignal }) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.get(`/feedback/patient/${patientId}`);
        if (response.success && response.data) {
          setFeedbackList(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch feedback.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching feedback.');
        console.error('Error fetching patient feedback:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) { // Only fetch if patientId is valid
      fetchFeedback();
    } else {
      setLoading(false);
      setError("Patient ID not provided.");
    }
  }, [patientId, refreshSignal]); // Re-fetch if patientId or refreshSignal changes

  if (loading) {
    return <div className="card"><p>Loading feedback...</p></div>;
  }

  if (error) {
    return <div className="card"><div className="alert error">{error}</div></div>;
  }

  return (
    <div className="card">
      <div className="card-hd">
        <h4>Feedback from Specialists</h4>
      </div>
      <div className="card-bd">
        {feedbackList.length === 0 ? (
          <p>No feedback received yet.</p>
        ) : (
          <ul>
            {feedbackList.map(feedback => (
              <li key={feedback.Feedback_ID} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <p><strong>Specialist:</strong> {feedback.Specialist_Name}</p>
                <p>{feedback.Content}</p>
                <small>Received on: {new Date(feedback.Created_At).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PatientFeedbackList;
