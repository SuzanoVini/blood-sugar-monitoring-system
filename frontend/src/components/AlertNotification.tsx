import React, { useEffect, useState } from "react";
import api from "../services/apiService";
import socketService from "../services/socketService"; // Added

// Interface for historical alerts from the API
interface Alert {
  alert_id: string | number;
  sent_at?: string | null;
  summary?: string;
  abnormal_count?: number;
}

// Interface for real-time notifications from WebSocket
interface NotificationData {
  id: string; // Unique ID for the notification
  type: string;
  title: string;
  message: string;
  timestamp: string;
}

/**
 * AlertNotification - shows active alerts for the patient.
 */
const AlertNotification: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [realTimeNotifications, setRealTimeNotifications] = useState<NotificationData[]>([]); // Added state for real-time alerts

  // --- Start of Added Code ---
  // Effect for handling real-time socket notifications
  useEffect(() => {
    const handleNotification = (data: any) => {
      console.log('Real-time alert received:', data);
      const newNotification: NotificationData = {
        ...data,
        id: data.id
      };
      setRealTimeNotifications(prev => [newNotification, ...prev]);
    };

    socketService.onNotification(handleNotification);

    // Cleanup subscription on component unmount
    return () => {
      socketService.offNotification(handleNotification);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const dismissNotification = (id: string) => {
    setRealTimeNotifications(prev => prev.filter(n => n.id !== id));
  };
  // --- End of Added Code ---


  // This is the original effect for fetching historical alerts
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

  // If there are no alerts of either type, render nothing
  if ((!alerts || alerts.length === 0) && realTimeNotifications.length === 0) return null;

  return (
    <div className="card">
      {/* --- Start of Added JSX --- */}
      {/* Section for displaying new, real-time notifications */}
      {realTimeNotifications.length > 0 && (
        <div className="real-time-alerts">
          <ul>
            {realTimeNotifications.map((n) => (
              <li key={n.id} className={`notification ${n.type}`}>
                <div className="notification-content">
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <small>{new Date(n.timestamp).toLocaleString()}</small>
                </div>
                <button onClick={() => dismissNotification(n.id)} className="close-btn" aria-label="Dismiss">&times;</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* --- End of Added JSX --- */}

      {/* This is the original JSX for historical alerts */}
      {alerts && alerts.length > 0 && (
        <>
          <h4>Historical Alerts</h4>
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
        </>
      )}
    </div>
  );
};

export default AlertNotification;
