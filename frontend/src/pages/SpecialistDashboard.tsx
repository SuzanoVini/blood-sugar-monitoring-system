import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/apiService";
import authService from "../services/authService";

interface Patient {
  patient_id: string | number;
  name: string;
  healthcare_number: string;
}

/**
 * SpecialistDashboard - lists assigned patients & allows review (simple).
 */
const SpecialistDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res: Patient[] = await api.getAssignedPatients();
        setPatients(res);
      } catch (err) {
        console.error("Failed to load assigned patients", err);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
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
        }}
      >
        <h2>Specialist Dashboard</h2>
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

      <div className="card">
        <h4>Assigned Patients</h4>
        {patients.length === 0 ? (
          <div>No patients assigned.</div>
        ) : (
          <ul>
            {patients.map((p) => (
              <li key={p.patient_id}>
                {p.name} — {p.healthcare_number}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SpecialistDashboard;
