import React, { useState } from "react";
import Navigation from "./components/Navigation";
import PatientDashboard from "./pages/PatientDashboard";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import "./styles/global.css";

/**
 * App - main application entry point without routing
 */
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("patient");

  const renderPage = () => {
    switch (currentPage) {
      case "patient":
        return <PatientDashboard />;
      case "specialist":
        return <SpecialistDashboard />;
      case "admin":
        return <AdminDashboard />;
      case "staff":
        return <StaffDashboard />;
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <div className="app-container">
      <Navigation onNavigate={setCurrentPage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
};

export default App;
