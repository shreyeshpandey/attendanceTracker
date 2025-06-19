import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import '../styles/style.css';

export default function MonthlySummary() {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), 'yyyy-MM')
  );
  const [summaryData, setSummaryData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setEmployees(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const start = startOfMonth(new Date(`${selectedMonth}-01`));
    const end = endOfMonth(new Date(`${selectedMonth}-01`));

    const q = query(
      collection(db, 'attendance'),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data());
      setAttendanceRecords(records);
    });

    return () => unsub();
  }, [selectedMonth]);

  useEffect(() => {
    if (employees.length === 0 || attendanceRecords.length === 0) {
      setSummaryData([]);
      return;
    }

    const totals = {};
    attendanceRecords.forEach(({ employeeId, status }) => {
      if (!totals[employeeId]) {
        totals[employeeId] = 0;
      }
      totals[employeeId] += Number(status);
    });

    const result = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      total: totals[emp.id] || 0,
    }));

    setSummaryData(result);
  }, [employees, attendanceRecords]);

  return (
    <div className="tracker-wrapper">
      <div className="tracker-container">
        <h1 className="tracker-title">Monthly Attendance Summary</h1>

        <div className="summary-header">
          <input
            type="month"
            className="month-picker"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          />
        </div>

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Total Attendance</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map(emp => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}