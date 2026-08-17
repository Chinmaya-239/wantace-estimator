import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { session } = useAuth();
  if (!session?.token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
