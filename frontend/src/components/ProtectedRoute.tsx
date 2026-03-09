import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Feature: Dynamic Route Protection (?session=...)
  if (role === "citizen" && token) {
    const searchParams = new URLSearchParams(location.search);
    const urlSession = searchParams.get("session");

    // If there is no ?session= parameter at all, append it and replace the URL history
    if (!urlSession) {
      return (
        <Navigate
          to={`${location.pathname}?session=${token}`}
          replace
        />
      );
    }

    // If the ?session= parameter does not match the logged-in session token, force redirect to correct dashboard
    if (urlSession !== token) {
      return (
        <Navigate
          to={`/dashboard/citizen?session=${token}`}
          replace
        />
      );
    }
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their appropriate dashboard if they try to access wrong route
    if (role === "citizen") {
      return (
        <Navigate
          to={`/dashboard/citizen?session=${token}`}
          replace
        />
      );
    }
    // Default fallback
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
