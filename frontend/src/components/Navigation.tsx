import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import authService from "../services/authService";

import AuthenticationDashboard from "../pages/AuthenticationDashboard";
import PatientDashboard from "../pages/PatientDashboard";
import SpecialistDashboard from "../pages/SpecialistDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import StaffDashboard from "../pages/StaffDashboard";
import ProfilePage from "../pages/ProfilePage"; // Import ProfilePage
import PatientDetailsPage from "../pages/PatientDetailsPage"; // Import PatientDetailsPage
import StaffPatientDetailsPage from "../pages/StaffPatientDetailsPage"; // Import StaffPatientDetailsPage
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword"; // Import ForgotPassword page
import ResetPassword from "../pages/ResetPassword"; // Import ResetPassword page

const Navigation: React.FC = () => {
  const isLoggedIn = authService.isAuthenticated();
  const token = authService.getToken();
  let userRole: string | null = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (import.meta.env.DEV) {
        console.log("Decoded JWT payload:", payload);
      }
      if (payload.role) {
        userRole = payload.role.toLowerCase().replace(/\s+/g, "_"); // normalize role
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Invalid token:", err);
      }
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
      {/* Public Routes */}
      <Route path="/login" element={<AuthenticationDashboard />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Forgot Password Route */}
      <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* Reset Password Route */}
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />


      {/* Redirect unauthenticated users */}
      {!isLoggedIn && (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}

      {/* Protected Routes */}
      {isLoggedIn && (
        <>
          <Route path="/profile" element={<ProfilePage />} /> {/* Add ProfilePage route */}
          {userRole === "patient" && <Route path="/dashboard" element={<PatientDashboard />} />}
          {userRole === "specialist" && <Route path="/specialist" element={<SpecialistDashboard />} />}
          {userRole === "specialist" && <Route path="/specialist/patient/:patientId" element={<PatientDetailsPage />} />}
          {userRole === "administrator" && <Route path="/admin" element={<AdminDashboard />} />}
          {userRole === "clinic_staff" && <Route path="/staff" element={<StaffDashboard />} />}
          {userRole === "clinic_staff" && <Route path="/staff/patient/:patientId" element={<StaffPatientDetailsPage />} />}
          
          {/* Default authenticated route based on role */}
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </>
      )}
    </Routes>
  );
};

export default Navigation;
