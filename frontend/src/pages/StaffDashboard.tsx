import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        <h2>Clinic Staff</h2>
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
    </div>
  );
};

export default StaffDashboard;
