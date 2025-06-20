import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { db } from '../firebase/firebase';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import '../styles/style.css';
import { useAuth } from '../context/AuthContext';
import { useSiteFilter } from '../context/SiteFilterContext'; // ✅ NEW

const ATTENDANCE_TYPES = [
  { label: 'Absent', value: 0 },
  { label: 'Half Day', value: 0.5 },
  { label: 'Full Day', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
];

export default function AttendanceTracker() {
  const { role } = useAuth();
  const { siteFilter } = useSiteFilter(); // ✅ USE FILTER
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [attendanceData, setAttendanceData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'employees'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to load employees');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'attendance'),
      where('date', '==', selectedDate)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = {};
        snapshot.forEach((doc) => {
          const record = doc.data();
          data[record.employeeId] = record;
        });
        setAttendanceData(data);
      },
      (err) => {
        console.error(err);
        setError('Failed to load attendance');
      }
    );

    return () => unsub();
  }, [selectedDate]);

  const handleChange = async (empId, field, value) => {
    if (role === 'viewer') return;

    const docId = `${empId}_${selectedDate}`;
    const current = attendanceData[empId] || {
      employeeId: empId,
      date: selectedDate,
      status: '',
      target: '',
      comment: '',
    };

    const updated = {
      ...current,
      [field]: field === 'status' ? Number(value) : value,
    };

    try {
      await setDoc(doc(db, 'attendance', docId), updated);
      setAttendanceData((prev) => ({
        ...prev,
        [empId]: updated,
      }));
    } catch (err) {
      console.error('Error updating:', err);
      alert('Update failed.');
    }
  };

  // ✅ Filter employees based on global siteFilter
  const filteredEmployees = siteFilter
    ? employees.filter((emp) => emp.site.toLowerCase() === siteFilter.toLowerCase())
    : employees;
    console.log('Current siteFilter:', siteFilter);
  return (
    <div className="tracker-wrapper">
      <div className="tracker-container">
        <h1 className="tracker-title">
          Attendance Tracker{siteFilter ? ` - Site: ${siteFilter}` : ''}
        </h1>

        {role === 'viewer' && (
          <p className="view-only-warning">
            View-only access. You cannot modify attendance data.
          </p>
        )}

        <div className="tracker-header">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p>No employees found for this site.</p>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Attendance</th>
                <th>Target</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const current = attendanceData[emp.id] || {};
                return (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>
                      <select
                        value={current.status || ''}
                        onChange={(e) => handleChange(emp.id, 'status', e.target.value)}
                        disabled={role === 'viewer'}
                      >
                        <option value="">-- Select --</option>
                        {ATTENDANCE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Target"
                        value={current.target || ''}
                        onChange={(e) => handleChange(emp.id, 'target', e.target.value)}
                        disabled={role === 'viewer'}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Comment"
                        value={current.comment || ''}
                        onChange={(e) => handleChange(emp.id, 'comment', e.target.value)}
                        disabled={role === 'viewer'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}