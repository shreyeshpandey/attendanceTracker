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
import { useSiteFilter } from '../context/SiteFilterContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ✅ This is required

export default function MonthlySummary() {
  const { siteFilter } = useSiteFilter();
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

    const filteredEmployees = siteFilter
      ? employees.filter((emp) => emp.site.toLowerCase() === siteFilter.toLowerCase())
      : employees;

    const totals = {};
    attendanceRecords.forEach(({ employeeId, status }) => {
      const numericStatus = Number(status);
      if (!totals[employeeId]) {
        totals[employeeId] = { total: 0 };
      }
      totals[employeeId].total += numericStatus;
    });

    const result = filteredEmployees
      .map((emp) => {
        const total = totals[emp.id]?.total || 0;
        const rate = emp.rate || 0;
        const payment = total * rate;
        return {
          id: emp.id,
          name: emp.name,
          total,
          payment
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    setSummaryData(result);
  }, [employees, attendanceRecords, siteFilter]);

  const topAttendance = summaryData.length
    ? Math.max(...summaryData.map((emp) => emp.total))
    : 0;

  const grandTotal = summaryData.reduce((sum, emp) => sum + emp.total, 0);

  const downloadCSV = () => {
    const headers = ['Name', 'Total Attendance', 'Payment'];
    const rows = summaryData.map((emp) => [
      emp.name,
      emp.total,
      `Rs. ${emp.payment.toFixed(2)}`
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Monthly_Summary_${selectedMonth}_${siteFilter || 'All'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
   const doc = new jsPDF();
   doc.setFontSize(16);
   doc.text(
     `Monthly Attendance Summary (${selectedMonth}) – ${siteFilter || 'All Sites'}`,
     14,
     20
   );
 
   const tableColumn = ['Name', 'Total Attendance', 'Payment'];
   const tableRows = summaryData.map((emp) => [
     emp.name,
     emp.total,
     `Rs. ${emp.payment.toFixed(2)}`
   ]);
 
   autoTable(doc, {
     startY: 30,
     head: [tableColumn],
     body: tableRows
   });
 
   const totalPay = summaryData.reduce((sum, emp) => sum + emp.payment, 0).toFixed(2);
   doc.text(`Total Attendance: ${grandTotal}`, 14, doc.lastAutoTable.finalY + 10);
   doc.text(`Total Payment: Rs. ${totalPay}`, 14, doc.lastAutoTable.finalY + 20);
 
   doc.save(`Monthly_Summary_${selectedMonth}_${siteFilter || 'All'}.pdf`);
 };

  return (
    <div className="tracker-wrapper">
      <div className="tracker-container">
        <h1 className="tracker-title">
          Monthly Summary – Site: {siteFilter || 'All Sites'}
        </h1>

        <div className="summary-header">
          <input
            type="month"
            className="month-picker"
            value={selectedMonth}
            aria-label="Select month"
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        {loading && <p style={{ textAlign: 'center' }}>Loading data...</p>}
        {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}

        {!loading && summaryData.length === 0 && (
          <p style={{ textAlign: 'center' }}>
            No attendance data found for this site/month.
          </p>
        )}

        {!loading && summaryData.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', margin: '0.5rem 0' }}>
              <button onClick={downloadCSV} className="btn-export">
                📥 Download CSV
              </button>
              <button onClick={downloadPDF} className="btn-export">
                📄 Download PDF
              </button>
            </div>

            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total Attendance</th>
                  <th>Payment</th>
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
                    <td>₹ {emp.payment.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ textAlign: 'right', marginTop: '1rem' }}>
              <strong>Total Attendance of All Employees:</strong> {grandTotal}
            </p>
            <p style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <strong>Total Payment of All Employees:</strong> ₹{' '}
              {summaryData.reduce((sum, emp) => sum + emp.payment, 0).toFixed(2)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}