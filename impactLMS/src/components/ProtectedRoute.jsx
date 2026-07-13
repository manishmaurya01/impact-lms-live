import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * Redirects to /login if no token is found in localStorage.
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
