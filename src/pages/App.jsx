import React from 'react';
import AttendanceTracker from '../components/AttendanceTracker.jsx';
import MonthlySummary from '../components/MonthlySummary.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ManageEmployees from './ManageEmployees'; 
import Register from './Register';
import Login from './Login';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';
import { SiteFilterProvider } from '../context/SiteFilterContext'; // 👈 import
import AdminApproval from './AdminApproval';

export default function App() {
  return (
    <AuthProvider>
      <SiteFilterProvider> {/* 👈 wrap entire router */}
        <Router>
          <Routes>
            {/* 🔓 Public routes */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* 🔐 Protected layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'viewer']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'viewer']}>
                    <AttendanceTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="monthly-summary"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'viewer']}>
                    <MonthlySummary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manage-employees"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageEmployees />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </SiteFilterProvider>
    </AuthProvider>
  );
}