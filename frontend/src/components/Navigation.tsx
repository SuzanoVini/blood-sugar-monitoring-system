import React from "react";
import authService from "../services/authService";

interface NavigationProps {
  onNavigate: (page: string) => void;
}

/**
 * Navigation component for the app.
 */
const Navigation: React.FC<NavigationProps> = ({ onNavigate }) => {
  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="navigation">
      <h3>Blood Sugar Monitor</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <button onClick={() => onNavigate("patient")}>
            Patient Dashboard
          </button>
        </li>
        <li>
          <button onClick={() => onNavigate("specialist")}>
            Specialist Dashboard
          </button>
        </li>
        <li>
          <button onClick={() => onNavigate("staff")}>Clinic Staff</button>
        </li>
        <li>
          <button onClick={() => onNavigate("admin")}>Admin</button>
        </li>
      </ul>
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
