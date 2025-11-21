import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/apiService";
import authService from "../services/authService";
import Modal from "../components/Modal"; // Import Modal component
import FeedbackForm from "../components/FeedbackForm"; // Import FeedbackForm component
import AlertNotification from "../components/AlertNotification"; // Import AlertNotification component

interface Reading {
  reading_id: string | number;
  patient_id: string | number;
  patient_name: string;
  datetime: string;
  value: number;
  unit?: string;
  category?: string;
  food_notes?: string;
  activity_notes?: string;
  notes?: string;
  symptoms?: string;
}

interface AssignedPatient {
  patient_id: string | number;
  name: string;
  healthcare_number: string;
}

/**
 * SpecialistDashboard - lists assigned patients & allows review.
 */
const SpecialistDashboard: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<AssignedPatient[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [patientNameFilter, setPatientNameFilter] = useState("");
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedPatientForFeedback, setSelectedPatientForFeedback] = useState<AssignedPatient | null>(null);
  const [specialistId, setSpecialistId] = useState<number | null>(null); // State to store specialistId

  const navigate = useNavigate();

  const loadAssignedPatients = async () => {
    setLoadingPatients(true);
    try {
      const res: AssignedPatient[] = await api.getAssignedPatients();
      setAssignedPatients(res);
    } catch (err) {
      console.error("Failed to load assigned patients", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadReadings = async () => {
    setLoadingReadings(true);
    try {
      const filters = {
        startDate: startDate || null,
        endDate: endDate || null,
        category: categoryFilter === "All" ? null : categoryFilter,
        patientName: patientNameFilter || null,
      };
      const res: Reading[] = await api.getSpecialistReadings(filters);
      setReadings(res);
    } catch (err) {
      console.error("Failed to load readings for specialist", err);
    } finally {
      setLoadingReadings(false);
    }
  };

  useEffect(() => {
    const fetchSpecialistId = async () => {
      const user = await authService.getCurrentUser();
      if (user && user.user_id) {
        setSpecialistId(user.user_id);
      } else {
        // Handle case where specialist ID is not available (e.g., not logged in)
        navigate("/login");
      }
    };
    fetchSpecialistId();
    loadAssignedPatients();
    loadReadings();
  }, []);

  useEffect(() => {
    loadReadings();
  }, [startDate, endDate, categoryFilter, patientNameFilter]);

  const handleApplyFilters = () => loadReadings();

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setCategoryFilter("All");
    setPatientNameFilter("");
  };

  const handlePatientClick = (patientName: string) => {
    setPatientNameFilter(patientName);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleOpenFeedbackModal = (patient: AssignedPatient) => {
    setSelectedPatientForFeedback(patient);
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedPatientForFeedback(null);
    // Optionally refresh assigned patients list if feedback data is part of it
    // loadAssignedPatients(); 
  };

  const handleFeedbackSubmitted = () => {
    handleCloseFeedbackModal();
    // Maybe refresh readings if feedback influences any display there
    // loadReadings(); 
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h2>Specialist Dashboard</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link to="/profile" className="btn">My Profile</Link>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#ff4d4d",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <AlertNotification />

      {/* Assigned Patients */}
      <div className="card mb-4">
        <h4>Assigned Patients</h4>
        {loadingPatients ? (
          <div>Loading assigned patients...</div>
        ) : assignedPatients.length === 0 ? (
          <div>No patients assigned.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {assignedPatients.map((p) => (
              <li key={p.patient_id} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePatientClick(p.name); }}
                  style={{ textDecoration: 'none', color: '#2b7cff', cursor: 'pointer' }}
                >
                  {p.name} — {p.healthcare_number}
                </a>
                <button
                  onClick={() => handleOpenFeedbackModal(p)}
                  className="btn secondary"
                  style={{ padding: '5px 10px', fontSize: '0.8em' }}
                >
                  Provide Feedback
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <h4>Filter Readings</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "15px" }}>
          <div className="input-group" style={{ flex: '1' }}>
            <label>Start Date</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: '1' }}>
            <label>End Date</label>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: '1' }}>
            <label>Category</label>
            <select className="select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Normal">Normal</option>
              <option value="Borderline">Borderline</option>
              <option value="Abnormal">Abnormal</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: '1' }}>
            <label>Patient Name</label>
            <input
              type="text"
              className="input"
              value={patientNameFilter}
              onChange={(e) => setPatientNameFilter(e.target.value)}
              placeholder="Filter by patient name"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleApplyFilters} className="btn primary">Apply Filters</button>
          <button onClick={handleClearFilters} className="btn secondary">Clear Filters</button>
        </div>
      </div>

      {/* Readings Table */}
      <div className="bg-white p-4 rounded-xl shadow-lg mb-4 overflow-x-auto">
        <h4 className="text-lg font-semibold text-blue-600 mb-2">All Assigned Readings</h4>
        {loadingReadings ? (
          <p>Loading readings...</p>
        ) : readings.length === 0 ? (
          <p>No readings found for the selected filters.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>DateTime</th>
                <th>Value</th>
                <th>Category</th>
                <th>Food</th>
                <th>Activity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.reading_id} className="hover:bg-gray-50 transition rounded">
                  <td>{r.patient_name}</td>
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

      {/* Feedback Modal */}
      {isFeedbackModalOpen && selectedPatientForFeedback && specialistId && (
        <Modal
          isOpen={isFeedbackModalOpen}
          onClose={handleCloseFeedbackModal}
          title={`Provide Feedback for ${selectedPatientForFeedback.name}`}
        >
          <FeedbackForm
            patientId={Number(selectedPatientForFeedback.patient_id)}
            specialistId={specialistId}
            onFeedbackSubmitted={handleFeedbackSubmitted}
          />
        </Modal>
      )}
    </div>
  );
};

export default SpecialistDashboard;
