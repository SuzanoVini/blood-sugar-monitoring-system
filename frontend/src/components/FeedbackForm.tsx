// frontend/src/components/FeedbackForm.tsx
// Author: Gemini
// Purpose: A reusable form component for specialists to submit feedback to patients.

import React, { useState } from 'react';
import apiService from '../services/apiService'; // Assuming apiService handles POST requests

interface FeedbackFormProps {
  patientId: number;
  specialistId: number; // The ID of the currently logged-in specialist
  onFeedbackSubmitted?: () => void; // Optional callback after successful submission
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ patientId, specialistId, onFeedbackSubmitted }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (content.trim().length === 0) {
      setError('Feedback content cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      // API call to the backend feedback route (POST /api/feedback)
      const response = await apiService.post('/feedback', {
        specialist_id: specialistId,
        patient_id: patientId,
        content: content.trim(),
      });

      if (response.success) {
        setSuccess('Feedback submitted successfully!');
        setContent(''); // Clear the form
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(); // Notify parent component
        }
      } else {
        throw new Error(response.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
      console.error('Error submitting feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-hd">
        <h4>Submit Feedback for Patient {patientId}</h4>
      </div>
      <div className="card-bd">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <div className="form-group">
            <label htmlFor="feedbackContent">Feedback Content</label>
            <textarea
              id="feedbackContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Enter your feedback here..."
              disabled={loading}
              required
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
