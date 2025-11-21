import React, { useState, useEffect } from "react"; // Import useEffect
import { useNavigate, Link } from "react-router-dom"; // Import Link
import api from "../services/apiService";
import authService from "../services/authService";
import ThresholdManager from '../components/ThresholdManager';
import UserManagement from '../components/UserManagement';
import CreateUserForm from '../components/CreateUserForm';

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
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
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
    let startDate = '';
    let endDate = '';

    if (periodType === 'Monthly') {
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
    } else { // Yearly
        const firstDay = new Date(selectedYear, 0, 1);
        const lastDay = new Date(selectedYear, 11, 31);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
    }

    setGeneratingReport(true);
    try {
      // Calls the backend endpoint POST /api/reports/generate
      const response = await api.post('/reports/generate', { periodType, periodStart: startDate, periodEnd: endDate });
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

      {/* Render the CreateUserForm component */}
      <CreateUserForm />

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
        {periodType === 'Monthly' && (
          <div>
            <label>Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <label>Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}
                </option>
              ))}
            </select>
          </div>
        )}
        {periodType === 'Yearly' && (
          <div>
            <label>Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}
                </option>
              ))}
            </select>
          </div>
        )}
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
                <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--line)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)' }}>
                    <h5>Selected Report Summary:</h5>
                    <p><strong>Period Type:</strong> {selectedReportSummary.period.type}</p>
                    <p><strong>Period:</strong> {selectedReportSummary.period.start} to {selectedReportSummary.period.end}</p>
                    <p><strong>Generated At:</strong> {new Date(selectedReportSummary.generated_at).toLocaleString()}</p>

                    <h6 style={{ marginTop: '1rem' }}>Overall Reading Statistics:</h6>
                    <p><strong>Total Readings:</strong> {selectedReportSummary.readings.total}</p>
                    <p><strong>Average Reading:</strong> {selectedReportSummary.readings.average} mg/dl</p>
                    <p><strong>Min Reading:</strong> {selectedReportSummary.readings.min} mg/dl</p>
                    <p><strong>Max Reading:</strong> {selectedReportSummary.readings.max} mg/dl</p>
                    <p><strong>Categorization:</strong> Normal ({selectedReportSummary.readings.by_category.normal}), Borderline ({selectedReportSummary.readings.by_category.borderline}), Abnormal ({selectedReportSummary.readings.by_category.abnormal})</p>

                    <h6 style={{ marginTop: '1rem' }}>Patient Statistics:</h6>
                    <p><strong>Total Active Patients in Period:</strong> {selectedReportSummary.patients.total_active}</p>
                    {selectedReportSummary.patients.list && selectedReportSummary.patients.list.length > 0 && (
                        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient Name</th>
                                        <th>Email</th>
                                        <th>Avg. Reading</th>
                                        <th>Highest</th>
                                        <th>Lowest</th>
                                        <th>Total Readings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedReportSummary.patients.list.map((patientTrend: any) => (
                                        <tr key={patientTrend.id}>
                                            <td>{patientTrend.name}</td>
                                            <td>{patientTrend.email}</td>
                                            <td>{(patientTrend.average_reading !== null && patientTrend.average_reading !== undefined) ? parseFloat(patientTrend.average_reading).toFixed(2) : 'N/A'}</td>
                                            <td>{(patientTrend.highest_reading !== null && patientTrend.highest_reading !== undefined) ? patientTrend.highest_reading : 'N/A'}</td>
                                            <td>{(patientTrend.lowest_reading !== null && patientTrend.lowest_reading !== undefined) ? patientTrend.lowest_reading : 'N/A'}</td>
                                            <td>{patientTrend.total_readings || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <h6 style={{ marginTop: '1rem' }}>AI-Powered Insights:</h6>
                    <p><strong>Top 3 Triggers for Abnormal Readings:</strong></p>
                    {selectedReportSummary.aiInsights && selectedReportSummary.aiInsights.topTriggers && selectedReportSummary.aiInsights.topTriggers.length > 0 ? (
                        <ul>
                            {selectedReportSummary.aiInsights.topTriggers.map((trigger: any, index: number) => (
                                <li key={index}>{trigger.trigger} ({trigger.count} times)</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No significant triggers found for this period.</p>
                    )}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
