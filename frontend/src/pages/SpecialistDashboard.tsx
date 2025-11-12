import React, { useEffect, useState } from "react";
import api from "../services/apiService";

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

  return (
    <div>
      <h2>Specialist Dashboard</h2>
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
