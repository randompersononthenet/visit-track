import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { hasRole } from '../lib/auth';

export function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactElement }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!hasRole(roles)) return <Navigate to="/dashboard" replace />;
  return children;
}
