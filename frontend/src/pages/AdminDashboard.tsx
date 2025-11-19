import React, { useState, useEffect } from "react"; // Import useEffect
import { useNavigate, Link } from "react-router-dom"; // Import Link
import api from "../services/apiService";
import authService from "../services/authService";
import ThresholdManager from '../components/ThresholdManager';
import UserManagement from '../components/UserManagement';

interface AdminDashboardProps {}

// Define the interface for a backend report
interface BackendReport {
  Report_ID: number;
  Admin_ID: number;
  Generated_By: string;
  Period_Type: "Monthly" | "Yearly";
  Period_Start: string;
  Period_End: string;
  Generated_At: string;
  Summary_Data: string; // Stored as JSON string
}

/**
 * AdminDashboard - trigger generation of monthly/yearly reports.
 */
const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [periodType, setPeriodType] = useState<"Monthly" | "Yearly">("Monthly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [historicalReports, setHistoricalReports] = useState<BackendReport[]>([]);
  const [selectedReportSummary, setSelectedReportSummary] = useState<any>(null); // To display parsed JSON

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Function to fetch historical reports
  const fetchHistoricalReports = async () => {
    setLoadingReports(true);
    try {
      const response = await api.get('/reports'); // Uses GET /api/reports
      if (response.success && response.data) {
        setHistoricalReports(response.data);
      } else {
        console.error("Failed to fetch historical reports:", response.message);
      }
    } catch (err) {
      console.error("Error fetching historical reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch reports on component mount
  useEffect(() => {
    fetchHistoricalReports();
  }, []); // Empty dependency array means this runs once on mount

  const handleGenerate = async () => {
    setGeneratingReport(true);
    try {
      // Calls the backend endpoint POST /api/reports/generate
      const response = await api.post('/reports/generate', { periodType, startDate, endDate });
      if (response.success) {
        alert("Report generated and saved successfully!");
        fetchHistoricalReports(); // Refresh the list of reports
      } else {
        alert(response.message || "Report generation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Report generation failed.");
    } finally {
      setGeneratingReport(false);
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
        <h2>Administrator Dashboard</h2>
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

      {/* Render the ThresholdManager component */}
      <ThresholdManager />

      {/* Render the UserManagement component */}
      <UserManagement />

      <div className="card">
        <h4>Generate New Report</h4> {/* Updated title */}
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
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generatingReport}>
            {generatingReport ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Section to display historical reports */}
      <div className="card">
        <h4>Historical Reports</h4>
        {loadingReports ? (
          <p>Loading historical reports...</p>
        ) : historicalReports.length === 0 ? (
          <p>No reports generated yet.</p>
        ) : (
          <div>
            <ul>
              {historicalReports.map((reportItem) => (
                <li key={reportItem.Report_ID} style={{ marginBottom: '0.5rem' }}>
                  Report ID: {reportItem.Report_ID} | Type: {reportItem.Period_Type} | Period: {reportItem.Period_Start} to {reportItem.Period_End}
                  <button
                    onClick={() => setSelectedReportSummary(JSON.parse(reportItem.Summary_Data))}
                    className="btn secondary"
                    style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    View Summary
                  </button>
                </li>
              ))}
            </ul>
            {selectedReportSummary && (
                <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <h5>Selected Report Summary:</h5>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(selectedReportSummary, null, 2)}
                    </pre>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
