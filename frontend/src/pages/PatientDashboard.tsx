import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BloodSugarForm from "../components/BloodSugarForm";
import ReadingsList from "../components/ReadingsList";
import AISuggestions from "../components/AISuggestions";
import AlertNotification from "../components/AlertNotification";
import TrendsChart from "../components/TrendsChart";
import api from "../services/apiService";
import authService from "../services/authService";

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

const PatientDashboard: React.FC = () => {
  const [signal, setSignal] = useState<number>(0);
  const [readingsForChart, setReadingsForChart] = useState<Reading[]>([]);
  const navigate = useNavigate();

  const refreshAll = async () => {
    setSignal((s) => s + 1);
    try {
      const data: Reading[] = await api.getReadings();
      setReadingsForChart(data);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 className="page-title">Patient Dashboard</h2>
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

      <div className="dashboard-grid">
        {/* Left column */}
        <div className="stack">
          <BloodSugarForm onSaved={refreshAll} />
          <ReadingsList refreshSignal={signal} />
        </div>

        {/* Right column */}
        <div className="stack">
          <AlertNotification />
          <AISuggestions refreshSignal={signal} />
          <TrendsChart readings={readingsForChart} />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
