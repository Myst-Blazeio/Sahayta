import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, role, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Feature: Dynamic Route Protection (?username=...)
  if (role === "citizen" && user?.username) {
    const searchParams = new URLSearchParams(location.search);
    const urlUsername = searchParams.get("username");

    // If there is no ?username= parameter at all, append it and replace the URL history
    if (!urlUsername) {
      return (
        <Navigate
          to={`${location.pathname}?username=${user.username}`}
          replace
        />
      );
    }

    // If the ?username= parameter does not match the logged-in session, force redirect to their correct dashboard
    if (urlUsername !== user.username) {
      return (
        <Navigate
          to={`/dashboard/citizen?username=${user.username}`}
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
          to={`/dashboard/citizen?username=${user?.username || "citizen"}`}
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
