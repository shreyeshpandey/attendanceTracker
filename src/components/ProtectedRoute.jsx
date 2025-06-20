import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <p style={{ textAlign: 'center' }}>Checking permissions...</p>;
  }

  if (!user || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}