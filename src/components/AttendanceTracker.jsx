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
import { useAuth } from '../context/AuthContext'; // ✅ Auth context

const ATTENDANCE_TYPES = [
  { label: 'Absent', value: 0 },
  { label: 'Half Day', value: 0.5 },
  { label: 'Full Day', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
];

export default function AttendanceTracker() {
  const { role } = useAuth(); // ✅ Get user role
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [attendanceData, setAttendanceData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch employees
  useEffect(() => {
    setLoading(true);
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

  // Fetch attendance for selected date
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

  const handleAddEmployee = async () => {
    if (!newName.trim()) return;

    const newId = `emp_${Date.now()}`;
    const newEmployee = {
      name: newName.trim(),
      imageUrl: '',
    };

    try {
      await setDoc(doc(db, 'employees', newId), newEmployee);
      setNewName('');
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee. Please try again.');
    }
  };

  const handleAttendanceChange = async (empId, value) => {
    if (role === 'viewer') return; // ❌ Block viewers
    const numericValue = Number(value);
    const docId = `${empId}_${selectedDate}`;
    const attendanceRecord = {
      employeeId: empId,
      date: selectedDate,
      status: numericValue,
    };

    try {
      await setDoc(doc(db, 'attendance', docId), attendanceRecord);
      setAttendanceData((prev) => ({
        ...prev,
        [empId]: attendanceRecord,
      }));
    } catch (err) {
      console.error('Error updating attendance:', err);
      alert('Failed to update attendance.');
    }
  };

  return (
    <div className="tracker-wrapper">
      <div className="tracker-container">
        <h1 className="tracker-title">Attendance Tracker</h1>

        {role === 'viewer' && (
          <p style={{ textAlign: 'center', color: '#999', marginBottom: '1rem' }}>
            View-only access. You cannot modify attendance data.
          </p>
        )}

        <div className="tracker-header">
          <select disabled>
            <option>All Employees</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Only Admin/Manager can add employee */}
        {role !== 'viewer' && (
          <div className="tracker-add-employee">
            <input
              type="text"
              placeholder="Add Employee"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              onClick={handleAddEmployee}
              disabled={!newName.trim()}
              style={{ opacity: newName.trim() ? 1 : 0.6 }}
            >
              Add
            </button>
          </div>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>
        )}

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading employees...</p>
        ) : employees.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No employees added yet.</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                {ATTENDANCE_TYPES.map((type) => (
                  <th key={type.value}>{type.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  {ATTENDANCE_TYPES.map((type) => (
                    <td key={type.value}>
                      <label
                        className={`attendance-option ${
                          attendanceData[emp.id]?.status === type.value
                            ? 'selected'
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`attendance-${emp.id}-${selectedDate}`}
                          value={type.value}
                          checked={
                            attendanceData[emp.id]?.status === type.value
                          }
                          onChange={(e) =>
                            handleAttendanceChange(emp.id, e.target.value)
                          }
                          disabled={role === 'viewer'}
                        />
                        {type.label}
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}