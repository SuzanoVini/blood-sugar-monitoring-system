import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import api from "../services/apiService";
import authService from "../services/authService";

interface Thresholds {
  normal_low: number;
  normal_high: number;
  borderline_low: number;
  borderline_high: number;
  abnormal_low: number;
  abnormal_high: number;
}

interface Patient {
  patient_id: string | number;
  name: string;
  email: string;
  status: string;
  healthcare_number: string;
  date_of_birth: string;
  threshold_normal_low: number | null;
  threshold_normal_high: number | null;
}

/**
 * StaffDashboard - manage thresholds & patient records (simple UI).
 */
const StaffDashboard: React.FC = () => {
  const [thresholds, setThresholds] = useState<Thresholds>({
    normal_low: 70,
    normal_high: 140,
    borderline_low: 141,
    borderline_high: 180,
    abnormal_low: 181,
    abnormal_high: 1000,
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientNameFilter, setPatientNameFilter] = useState("");
  const [healthcareNumberFilter, setHealthcareNumberFilter] = useState("");

  const navigate = useNavigate();

  const loadThresholds = async () => {
    try {
      const res: Thresholds = await api.getCategoryThreshold();
      if (res) setThresholds(res);
    } catch (err) {
      console.warn("No thresholds available yet");
    }
  };

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const res: Patient[] = await api.getStaffPatients();
      setPatients(res);
    } catch (err) {
      console.error("Failed to load patients for staff:", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadThresholds();
    loadPatients();
  }, []);

  const handleSaveThresholds = async () => {
    setSaving(true);
    try {
      await api.updateCategoryThreshold(thresholds);
      alert("Thresholds saved.");
    } catch (err) {
      console.error(err);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesName = patient.name.toLowerCase().includes(patientNameFilter.toLowerCase());
    const matchesHealthcareNumber = patient.healthcare_number.toLowerCase().includes(healthcareNumberFilter.toLowerCase());
    return matchesName && matchesHealthcareNumber;
  });


  return (
    <div className="container">
      {/* Header with Logout Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: '1rem', // Added gap for spacing
        }}
      >
        <h2>Clinic Staff Dashboard</h2>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <Link to="/profile" className="btn">
            My Profile
          </Link>
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

      <div className="card mb-4">
        <h4>Category Thresholds</h4>
        <div>
          <label>Normal Low</label>
          <input
            type="number"
            value={thresholds.normal_low?.toString() || ''} // Use optional chaining and fallback to empty string
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                normal_low: parseFloat(e.target.value || '0'), // Handle empty input
              })
            }
          />
        </div>
        <div>
          <label>Normal High</label>
          <input
            type="number"
            value={thresholds.normal_high?.toString() || ''} // Use optional chaining and fallback to empty string
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                normal_high: parseFloat(e.target.value || '0'), // Handle empty input
              })
            }
          />
        </div>
        <div>
          <label>Borderline Low</label>
          <input
            type="number"
            value={thresholds.borderline_low?.toString() || ''}
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                borderline_low: parseFloat(e.target.value || '0'),
              })
            }
          />
        </div>
        <div>
          <label>Borderline High</label>
          <input
            type="number"
            value={thresholds.borderline_high?.toString() || ''}
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                borderline_high: parseFloat(e.target.value || '0'),
              })
            }
          />
        </div>
        <div>
          <label>Abnormal Low</label>
          <input
            type="number"
            value={thresholds.abnormal_low?.toString() || ''}
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                abnormal_low: parseFloat(e.target.value || '0'),
              })
            }
          />
        </div>
        <div>
          <label>Abnormal High</label>
          <input
            type="number"
            value={thresholds.abnormal_high?.toString() || ''}
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                abnormal_high: parseFloat(e.target.value || '0'),
              })
            }
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            className="btn btn-primary"
            onClick={handleSaveThresholds}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <h4>All Patients</h4>
        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <div className="input-group" style={{ flex: '1' }}>
            <label>Filter by Name</label>
            <input
              type="text"
              className="input"
              value={patientNameFilter}
              onChange={(e) => setPatientNameFilter(e.target.value)}
              placeholder="Patient Name"
            />
          </div>
          <div className="input-group" style={{ flex: '1' }}>
            <label>Filter by Healthcare No.</label>
            <input
              type="text"
              className="input"
              value={healthcareNumberFilter}
              onChange={(e) => setHealthcareNumberFilter(e.target.value)}
              placeholder="Healthcare Number"
            />
          </div>
        </div>

        {loadingPatients ? (
          <p>Loading patients...</p>
        ) : filteredPatients.length === 0 ? (
          <p>No patients found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Healthcare Number</th>
                <th>Date of Birth</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.patient_id}>
                  <td>{p.patient_id}</td>
                  <td>
                    <Link to={`/staff/patient/${p.patient_id}`} style={{ textDecoration: 'none', color: '#2b7cff', cursor: 'pointer' }}>
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.email}</td>
                  <td>{p.healthcare_number}</td>
                  <td>{new Date(p.date_of_birth).toLocaleDateString()}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
