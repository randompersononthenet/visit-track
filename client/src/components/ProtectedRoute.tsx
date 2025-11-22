import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactElement }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
