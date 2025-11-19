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
  patient_id: number;
  name: string;
  email: string;
  healthcare_number: string;
  status: string;
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
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const limit = 20;

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res: Thresholds = await api.getCategoryThreshold();
        if (res) setThresholds(res);
      } catch (err) {
        console.warn("No thresholds available yet");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      try {
        const res = await api.getStaffPatients(limit, offset);
        setPatients(res);
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, [offset]);

  const handleSave = async () => {
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

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (patients.length === limit) {
      setOffset(offset + limit);
    }
  };

  return (
    <div>
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

      <div className="card">
        <h4>Category Thresholds</h4>
        <div>
          <label>Normal Low</label>
          <input
            type="number"
            value={thresholds.normal_low}
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                normal_low: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div>
          <label>Normal High</label>
          <input
            type="number"
            value={thresholds.normal_high}
            onChange={(e) =>
              setThresholds({
                ...thresholds,
                normal_high: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h4>Patient List</h4>
        {loading ? (
          <p>Loading patients...</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Email</th>
                  <th style={{ padding: '8px' }}>Healthcare Number</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '8px', textAlign: 'center' }}>
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.patient_id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{patient.name}</td>
                      <td style={{ padding: '8px' }}>{patient.email}</td>
                      <td style={{ padding: '8px' }}>{patient.healthcare_number}</td>
                      <td style={{ padding: '8px' }}>{patient.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
              <button
                className="btn"
                onClick={handlePrevPage}
                disabled={offset === 0}
                style={{ opacity: offset === 0 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span>Showing {offset + 1} - {offset + patients.length}</span>
              <button
                className="btn"
                onClick={handleNextPage}
                disabled={patients.length < limit}
                style={{ opacity: patients.length < limit ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
