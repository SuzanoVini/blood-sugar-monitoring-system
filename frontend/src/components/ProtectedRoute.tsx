import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "./services/authService";

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
