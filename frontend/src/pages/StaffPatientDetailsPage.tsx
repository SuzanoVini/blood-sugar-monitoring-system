// frontend/src/pages/StaffPatientDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import authService from '../services/authService';

// Re-usable components
// import ReadingsList from '../components/ReadingsList'; // No longer needed
import PatientFeedbackList from '../components/PatientFeedbackList'; // Will show Patient's feedback
// Removing unused imports for clarity and potential errors
// import AISuggestions from '../components/AISuggestions';
// import AlertNotification from '../components/AlertNotification';
// import TrendsChart from '../components/TrendsChart';
// import FeedbackForm from '../components/FeedbackForm';


// Interfaces
interface PatientDetails {
  patient_id: number;
  name: string;
  email: string;
  phone: string;
  profile_image: string;
  status: string;
  created_at: string;
  healthcare_number: string;
  date_of_birth: string;
  threshold_normal_low: number;
  threshold_normal_high: number;
}

interface Reading {
  reading_id?: string | number;
  datetime: string;
  value: number;
  unit?: string;
  category?: string;
  food_notes?: string;
  activity_notes?: string;
  notes?: string;
  symptoms?: string;
}

const StaffPatientDetailsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]); // Using any[] for simplicity
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState<number>(0); // For refreshing data

  const navigate = useNavigate();
  const patientIdNum = Number(patientId);

  useEffect(() => {
    const loadPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!patientIdNum) {
          throw new Error("Invalid Patient ID.");
        }

        // Fetch patient details, readings, and feedback concurrently
        const [detailsRes, readingsRes, feedbackRes] = await Promise.all([
          apiService.getStaffPatientDetails(patientIdNum),
          apiService.getStaffPatientReadings(patientIdNum),
          apiService.getStaffPatientFeedback(patientIdNum),
        ]);

        if (detailsRes) {
          setPatient(detailsRes);
        } else {
          throw new Error(detailsRes?.message || 'Failed to fetch patient details.');
        }

        if (readingsRes) {
          setReadings(readingsRes);
        } else {
          throw new Error(readingsRes?.message || 'Failed to fetch patient readings.');
        }

        if (feedbackRes) {
          setFeedback(feedbackRes);
        } else {
          throw new Error(feedbackRes?.message || 'Failed to fetch patient feedback.');
        }

      } catch (err: any) {
        setError(err.message || "An error occurred while fetching patient data.");
        console.error("Error loading staff patient data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId, signal, navigate]);

  const refreshData = () => setSignal(s => s + 1); // Function to trigger data refresh

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
        <Link to="/staff">&larr; Back to Staff Dashboard</Link>
      </div>

            <div style={{ marginBottom: '2rem' }}>

              <h2>Patient: {patient.name}</h2>

              <p>Email: {patient.email}</p>

              <p>Healthcare No: {patient.healthcare_number}</p>

              <p>Date of Birth: {new Date(patient.date_of_birth).toLocaleDateString()}</p>

              <p>Status: {patient.status}</p>

              {patient.profile_image && (

                  <img 

                      src={`http://localhost:5000/${patient.profile_image}`} 

                      alt="Profile" 

                      style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginTop: '10px' }}

                  />

              )}

            </div>

      

            <div className="stack"> {/* Use stack for vertical spacing between cards */}

              <div className="card">

                <div className="card-hd">

                  <h4>Readings History</h4>

                </div>

                <div className="card-bd">

                  {readings.length === 0 ? (

                    <p>No readings available for this patient.</p>

                  ) : (

                    <table className="data-table">

                      <thead>

                        <tr>

                          <th>DateTime</th>

                          <th>Value</th>

                          <th>Category</th>

                          <th>Food</th>

                          <th>Activity</th>

                          <th>Notes</th>

                        </tr>

                      </thead>

                      <tbody>

                        {readings.map((r, index) => (

                          <tr key={r.reading_id || index}>

                            <td>{new Date(r.datetime).toLocaleString()}</td>

                            <td>{r.value} {r.unit || "mg/dl"}</td>

                            <td>{r.category}</td>

                            <td>{r.food_notes}</td>

                            <td>{r.activity_notes}</td>

                            <td>{r.notes || r.symptoms}</td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  )}

                </div>

              </div>

      

              <div className="card">

                <div className="card-hd">

                  <h4>Feedback History</h4>

                </div>

                <div className="card-bd">

                  {feedback.length === 0 ? (

                    <p>No feedback available for this patient.</p>

                  ) : (

                    <ul style={{ listStyle: 'none', padding: 0 }}>

                      {feedback.map((f, index) => (

                        <li key={index} style={{ marginBottom: '10px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>

                          <p><strong>Specialist:</strong> {f.specialist_name || 'N/A'}</p>

                          <p><strong>Content:</strong> {f.content}</p>

                          <p style={{ fontSize: '0.8em', color: 'var(--muted)' }}>

                            {new Date(f.created_at).toLocaleString()}

                          </p>

                        </li>

                      ))}

                    </ul>

                  )}

                </div>

              </div>

            </div>

          </div>

        );

      };

      

      export default StaffPatientDetailsPage;