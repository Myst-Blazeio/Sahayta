import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, role, user } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their appropriate dashboard if they try to access wrong route
    if (role === "citizen") {
      const username = user?.username || "citizen"; 
      return (
        <Navigate
          to={`/dashboard/citizen/${username}`}
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
