import React, { useEffect, useState } from "react";
import api from "../services/apiService";

interface Alert {
  alert_id: string | number;
  sent_at?: string | null;
  summary?: string;
  abnormal_count?: number;
}

/**
 * AlertNotification - shows active alerts for the patient.
 */
const AlertNotification: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res: Alert[] = await api.getAlerts();
        if (mounted) setAlerts(res);
      } catch (err) {
        console.error("Failed to load alerts", err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="card">
      <h4>Alerts</h4>
      <ul>
        {alerts.map((a) => (
          <li key={a.alert_id}>
            <strong>
              {a.sent_at ? new Date(a.sent_at).toLocaleString() : "Now"}
            </strong>{" "}
            — {a.summary || `Abnormal count: ${a.abnormal_count ?? 0}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertNotification;
