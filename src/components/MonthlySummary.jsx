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
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
   attendanceRecords.forEach(({ employeeId, status, target }) => {
    const numericStatus = status === '' || status === undefined || status === null
      ? (target ? Number(target) : 0)
      : Number(status);
  
    if (!totals[employeeId]) {
      totals[employeeId] = { total: 0 };
    }
  
    totals[employeeId].total += numericStatus;
  });
 
   const result = filteredEmployees
     .map((emp) => {
       const hasRecords = attendanceRecords.some((rec) => rec.employeeId === emp.id);
       const total = hasRecords
         ? totals[emp.id]?.total || 0
         : emp.target
         ? Number(emp.target)
         : 0;
 
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

  const downloadAllSitesCSV = () => {
    const sites = [...new Set(employees.map((e) => e.site))].sort();

    const wb = XLSX.utils.book_new();

    sites.forEach((site) => {
      const siteEmployees = employees.filter((e) => e.site === site);
      const siteData = siteEmployees.map((emp) => {
        const total = attendanceRecords
          .filter((rec) => rec.employeeId === emp.id)
          .reduce((sum, rec) => sum + Number(rec.status), 0);
        const payment = total * (emp.rate || 0);

        return {
          Name: emp.name,
          'Total Attendance': total,
          Payment: `Rs. ${payment.toFixed(2)}`
        };
      });

      const subtotalAttendance = siteData.reduce((sum, e) => sum + e['Total Attendance'], 0);
      const subtotalPayment = siteData.reduce((sum, e) => sum + Number(e.Payment.replace('Rs. ', '')), 0);

      siteData.push({
        Name: 'Subtotal',
        'Total Attendance': subtotalAttendance,
        Payment: `Rs. ${subtotalPayment.toFixed(2)}`
      });

      const ws = XLSX.utils.json_to_sheet(siteData);
      XLSX.utils.book_append_sheet(wb, ws, site);
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `All_Sites_Summary_${selectedMonth}.xlsx`);
  };

  const downloadAllSitesPDF = () => {
    const doc = new jsPDF();
    const sites = [...new Set(employees.map((e) => e.site))].sort();

    let grandTotalAttendance = 0;
    let grandTotalPayment = 0;

    sites.forEach((site, index) => {
      if (index !== 0) doc.addPage();

      doc.setFontSize(16);
      doc.text(`Monthly Attendance Summary – ${selectedMonth}`, 14, 20);
      doc.setFontSize(13);
      doc.text(`Site: ${site}`, 14, 30);

      const siteEmployees = employees.filter((e) => e.site === site);
      const siteData = siteEmployees.map((emp) => {
        const total = attendanceRecords
          .filter((rec) => rec.employeeId === emp.id)
          .reduce((sum, rec) => sum + Number(rec.status), 0);
        const payment = total * (emp.rate || 0);

        grandTotalAttendance += total;
        grandTotalPayment += payment;

        return { ...emp, total, payment };
      });

      const tableRows = siteData.map((emp) => [
        emp.name,
        emp.total,
        `Rs. ${emp.payment.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Name', 'Total Attendance', 'Payment']],
        body: tableRows,
      });

      const subtotalAttendance = siteData.reduce((sum, e) => sum + e.total, 0);
      const subtotalPayment = siteData.reduce((sum, e) => sum + e.payment, 0);

      const endY = doc.lastAutoTable.finalY + 10;
      doc.text(`Subtotal Attendance: ${subtotalAttendance}`, 14, endY);
      doc.text(`Subtotal Payment: Rs. ${subtotalPayment.toFixed(2)}`, 14, endY + 10);
    });

    const lastY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(14);
    doc.text(`Grand Total Attendance (All Sites): ${grandTotalAttendance}`, 14, lastY);
    doc.text(`Grand Total Payment (All Sites): Rs. ${grandTotalPayment.toFixed(2)}`, 14, lastY + 10);

    doc.save(`All_Sites_Summary_${selectedMonth}.pdf`);
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
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                margin: '0.5rem 0'
              }}
            >
              <button onClick={downloadCSV} className="btn-export">
                📥 Download CSV
              </button>
              <button onClick={downloadPDF} className="btn-export">
                📄 Download PDF
              </button>

              {siteFilter === '' && (
                <>
                  <button onClick={downloadAllSitesPDF} className="btn-export">
                    🗂 All Sites PDF
                  </button>
                  <button onClick={downloadAllSitesCSV} className="btn-export">
                    📥 All Sites CSV
                  </button>
                </>
              )}
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