import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AppShell } from './shell/AppShell'
import { Dashboard } from './views/Dashboard'
import { Login } from './views/Login'
import { Register } from './views/Register'
import { Scan } from './views/Scan'
import { Reports } from './views/Reports'
import { VisitLogs } from './views/VisitLogs'
import { FrequentVisitors } from './views/FrequentVisitors'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Personnel } from './views/Personnel'
import { RoleRoute } from './components/RoleRoute'
import { PreRegistrations } from './views/PreRegistrations'
import { Users } from './views/Users'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
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
              <RoleRoute roles={["admin", "staff"]}>
                <VisitLogs />
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute roles={["admin", "staff"]}>
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
            path="/frequent-visitors"
            element={
              <RoleRoute roles={["admin", "staff"]}>
                <FrequentVisitors />
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
