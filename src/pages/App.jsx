import React, { useEffect, useState } from 'react';
import AttendanceTracker from '../components/AttendanceTracker.jsx';
import MonthlySummary from '../components/MonthlySummary.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ManageEmployees from './ManageEmployees'; 
import Register from './Register';
import Login from './Login';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';
import { SiteFilterProvider } from '../context/SiteFilterContext';

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Android/Chrome prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS manual detection
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    if (isIos && !isSafari) {
      setShowIosTip(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => {
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <AuthProvider>
      <SiteFilterProvider>
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

          {/* 📲 Android/Chrome prompt */}
          {deferredPrompt && (
            <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
              <button onClick={handleInstall} className="btn-export">
                📲 Add to Home Screen
              </button>
            </div>
          )}

          {/* 📱 iOS Chrome user tip */}
          {showIosTip && (
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                width: '100%',
                backgroundColor: '#fff8dc',
                color: '#333',
                padding: '1rem',
                textAlign: 'center',
                fontSize: '0.95rem',
                borderTop: '1px solid #ccc',
                zIndex: 9999
              }}
            >
              📱 For the best experience, open this app in <strong>Safari</strong> and tap <strong>“Add to Home Screen”</strong> from the Share menu.
            </div>
          )}
        </Router>
      </SiteFilterProvider>
    </AuthProvider>
  );
}