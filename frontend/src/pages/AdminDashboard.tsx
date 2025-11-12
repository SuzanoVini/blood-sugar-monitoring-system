import React, { useState } from "react";
import api from "../services/apiService";
import { generateReport } from "../utils/reportGenerator";
import type { Report } from "../utils/reportGenerator";

interface AdminDashboardProps {}

/**
 * AdminDashboard - trigger generation of monthly/yearly reports.
 */
const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [periodType, setPeriodType] = useState<"Monthly" | "Yearly">("Monthly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [report, setReport] = useState<Report | null>(null);

  const handleGenerate = async () => {
    try {
      // fetch readings and AI analyses, then create report
      const readings = await api.getAllReadings(startDate, endDate);
      const analyses = await api.getAIPatternAnalyses(startDate, endDate);
      const r: Report = generateReport({
        periodType,
        startDate,
        endDate,
        readings,
        analyses,
      });
      setReport(r);
      // optionally post to server
      await api.saveReport(r);
      alert("Report generated and saved.");
    } catch (err) {
      console.error(err);
      alert("Report generation failed.");
    }
  };

  return (
    <div>
      <h2>Administrator</h2>
      <div className="card">
        <h4>Create Report</h4>
        <div>
          <label>Type</label>
          <select
            value={periodType}
            onChange={(e) =>
              setPeriodType(e.target.value as "Monthly" | "Yearly")
            }
          >
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
        </div>
        <div>
          <label>Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label>End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={handleGenerate}>
            Generate
          </button>
        </div>
      </div>

      {report && (
        <div className="card">
          <h4>Report Summary</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
