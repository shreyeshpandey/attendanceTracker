import React from 'react';
import AttendanceTracker from '../components/AttendanceTracker.jsx';
import MonthlySummary from '../components/MonthlySummary.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ManageEmployees from './ManageEmployees'; 

export default function App() {
  return (
    <Router>
      <Routes>
        {/* ⬇️ Layout must be inside a Route */}
        <Route path="/" element={<Layout />}>
          <Route index element={<AttendanceTracker />} />
          <Route path="monthly-summary" element={<MonthlySummary />} />
          <Route path="manage-employees" element={<ManageEmployees />} />
        </Route>
      </Routes>
    </Router>
  );
}