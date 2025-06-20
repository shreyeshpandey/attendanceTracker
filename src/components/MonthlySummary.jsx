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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'employees'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);
    const start = startOfMonth(new Date(`${selectedMonth}-01`));
    const end = endOfMonth(new Date(`${selectedMonth}-01`));

    const q = query(
      collection(db, 'attendance'),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((doc) => doc.data());
        setAttendanceRecords(records);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

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

    const result = employees
      .map((emp) => ({
        id: emp.id,
        name: emp.name,
        total: totals[emp.id] || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setSummaryData(result);
  }, [employees, attendanceRecords]);

  const topAttendance = summaryData.length
    ? Math.max(...summaryData.map((emp) => emp.total))
    : 0;

  const grandTotal = summaryData.reduce((sum, emp) => sum + emp.total, 0);

  return (
    <div className="tracker-wrapper">
      <div className="tracker-container">
        <h1 className="tracker-title">Monthly Attendance Summary</h1>

        <div className="summary-header">
          <input
            type="month"
            className="month-picker"
            value={selectedMonth}
            aria-label="Select month"
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        {/* 🔄 Loading */}
        {loading && <p style={{ textAlign: 'center' }}>Loading data...</p>}

        {/* ⚠️ Error */}
        {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}

        {/* 📭 Empty */}
        {!loading && summaryData.length === 0 && (
          <p style={{ textAlign: 'center' }}>No attendance data found for this month.</p>
        )}

        {/* ✅ Data Table */}
        {!loading && summaryData.length > 0 && (
          <>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total Attendance</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((emp) => (
                  <tr
                    key={emp.id}
                    style={
                      emp.total === topAttendance
                        ? { backgroundColor: '#e0f7e9', fontWeight: 'bold' }
                        : {}
                    }
                  >
                    <td>{emp.name}</td>
                    <td>{emp.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 📊 Total */}
            <p style={{ textAlign: 'right', marginTop: '1rem' }}>
              <strong>Total Attendance of All Employees:</strong> {grandTotal}
            </p>
          </>
        )}
      </div>
    </div>
  );
}