import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import authService from "../services/authService";

import AuthenticationDashboard from "../pages/AuthenticationDashboard";
import PatientDashboard from "../pages/PatientDashboard";
import SpecialistDashboard from "../pages/SpecialistDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import StaffDashboard from "../pages/StaffDashboard";

const Navigation: React.FC = () => {
  const isLoggedIn = authService.isAuthenticated();
  const token = authService.getToken();
  let userRole: string | null = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("Decoded JWT payload:", payload);
      if (payload.role) {
        userRole = payload.role.toLowerCase().replace(" ", "_"); // normalize role
      }
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  // Role-based default route
  const roleDefaultRoute: { [key: string]: string } = {
    patient: "/dashboard",
    specialist: "/specialist",
    clinic_staff: "/staff",
    administrator: "/admin",
  };

  const defaultRoute = userRole ? roleDefaultRoute[userRole] : "/login";

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<AuthenticationDashboard />} />

      {/* Redirect unauthenticated users */}
      {!isLoggedIn && (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}

      {/* Protected Routes */}
      {isLoggedIn && (
        <>
          <Route path="/dashboard" element={<PatientDashboard />} />
          <Route path="/specialist" element={<SpecialistDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />

          {/* Default authenticated route based on role */}
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </>
      )}
    </Routes>
  );
};

export default Navigation;
