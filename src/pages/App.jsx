import React from 'react';
import AttendanceTracker from '../components/AttendanceTracker.jsx';
import MonthlySummary from '../components/MonthlySummary.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

function App() {
 return (
   <Router>
     <Routes>
       <Route path="/" element={<Layout />}>
         <Route index element={<AttendanceTracker />} />
         <Route path="summary" element={<MonthlySummary />} />
       </Route>
     </Routes>
   </Router>
 );
}

export default App;