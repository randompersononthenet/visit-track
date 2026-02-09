import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AppShell } from './shell/AppShell'
import { Dashboard } from './views/Dashboard'
import { Login } from './views/Login'
import { Register } from './views/Register'
import { RegisterExternal } from './views/RegisterExternal'
import { ArchivedVisitors } from './views/ArchivedVisitors'
import { ArchivedPersonnel } from './views/ArchivedPersonnel'
import { Scan } from './views/Scan'
import { Reports } from './views/Reports'
import { VisitLogs } from './views/VisitLogs'
import { FrequentVisitors } from './views/FrequentVisitors'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Personnel } from './views/Personnel'
import { RoleRoute } from './components/RoleRoute'
import { PermissionRoute } from './components/PermissionRoute'
import { Roles } from './views/Roles'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PreRegistrations } from './views/PreRegistrations'
import { Users } from './views/Users'
import { AuditLogs } from './views/AuditLogs'
import { isAuthenticated } from './lib/auth'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-external" element={<RegisterExternal />} />
            <Route path="/archived" element={<ArchivedVisitors />} />
            <Route path="/archived-personnel" element={<ArchivedPersonnel />} />
            <Route path="/personnel" element={<Personnel />} />
            <Route path="/scan" element={<Scan />} />
            <Route
              path="/prereg"
              element={
                <RoleRoute roles={["admin", "staff"]}>
                  <PreRegistrations />
                </RoleRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <RoleRoute roles={["admin", "staff", "warden"]}>
                  <VisitLogs />
                </RoleRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleRoute roles={["admin", "staff", "warden"]}>
                  <Reports />
                </RoleRoute>
              }
            />
            <Route
              path="/users"
              element={
                <RoleRoute roles={["admin"]}>
                  <Users />
                </RoleRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <RoleRoute roles={["admin"]}>
                  <AuditLogs />
                </RoleRoute>
              }
            />
            <Route
              path="/frequent-visitors"
              element={
                <RoleRoute roles={["admin", "staff"]}>
                  <FrequentVisitors />
                </RoleRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <PermissionRoute permission="roles:manage">
                  <Roles />
                </PermissionRoute>
              }
            />
            {/* Catch all for 404s inside AppShell */}
            <Route path="*" element={<div className="p-8 text-center text-slate-500">Page not found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
