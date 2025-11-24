import React, { useEffect, useState } from "react";
import api from "../services/apiService";

interface SpecialistOption {
  specialist_id: number;
  name: string;
  email: string;
}

interface AssignmentRow {
  patient_id: number;
  patient_name: string;
  patient_email: string;
  specialist_id?: number;
  specialist_name?: string;
  specialist_email?: string;
  assigned_at?: string;
}

const SpecialistAssignmentManager: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPatient, setSavingPatient] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [options, roster] = await Promise.all([
        api.getAdminAssignmentOptions(),
        api.getAdminAssignments(),
      ]);
      setSpecialists(options?.specialists || []);
      setAssignments(roster || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = async (patientId: number, value: string) => {
    setSavingPatient(patientId);
    setError(null);
    try {
      if (value === "") {
        await api.unassignSpecialistFromPatient(patientId);
      } else {
        await api.assignSpecialistToPatient(patientId, Number(value));
      }
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Unable to update assignment");
    } finally {
      setSavingPatient(null);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h4>Specialist Assignments</h4>
        <button className="btn secondary" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <p style={{ color: "#c00", marginTop: "0.5rem" }}>{error}</p>}
      {loading ? (
        <p>Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Assigned Specialist</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((row) => (
                <tr key={row.patient_id}>
                  <td>{row.patient_name}</td>
                  <td>{row.patient_email}</td>
                  <td>
                    <select
                      value={row.specialist_id ?? ""}
                      onChange={(e) => handleUpdate(row.patient_id, e.target.value)}
                      disabled={savingPatient === row.patient_id}
                    >
                      <option value="">Unassigned</option>
                      {specialists.map((s) => (
                        <option key={s.specialist_id} value={s.specialist_id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SpecialistAssignmentManager;
