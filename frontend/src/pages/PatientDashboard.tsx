import React, { useState } from "react";
import BloodSugarForm from "../components/BloodSugarForm";
import ReadingsList from "../components/ReadingsList";
import AISuggestions from "../components/AISuggestions";
import AlertNotification from "../components/AlertNotification";
import TrendsChart from "../components/TrendsChart";
import api from "../services/apiService";

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

/**
 * PatientDashboard - combines form, readings, AI suggestions, trend.
 */
const PatientDashboard: React.FC = () => {
  const [signal, setSignal] = useState<number>(0);
  const [readingsForChart, setReadingsForChart] = useState<Reading[]>([]);

  const refreshAll = async () => {
    setSignal((s) => s + 1);
    // update chart data quickly
    try {
      const data: Reading[] = await api.getReadings();
      setReadingsForChart(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">Patient Dashboard</h2>

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
