import React from "react";
import authService from "../services/authService";

interface NavigationProps {
  onNavigate: (page: string) => void;
  current?: "patient" | "specialist" | "staff" | "admin";
}

const Navigation: React.FC<NavigationProps> = ({ onNavigate, current }) => {
  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const Item: React.FC<{ id: NavigationProps["current"]; label: string }> = ({
    id,
    label,
  }) => (
    <button
      className={`topnav-item ${current === id ? "active" : ""}`}
      onClick={() => onNavigate(id!)}
    >
      {label}
    </button>
  );

  return (
    <header className="topbar">
      <div className="brand">
        <span className="dot" />
        <span>Blood Sugar Monitor</span>
      </div>

      <nav className="topnav">
        <Item id="patient" label="Patient Dashboard" />
        <Item id="specialist" label="Specialist Dashboard" />
        <Item id="staff" label="Clinic Staff" />
        <Item id="admin" label="Admin" />
      </nav>

      <div className="topbar-right">
        <button className="btn ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navigation;
