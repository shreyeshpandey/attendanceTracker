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

const ATTENDANCE_TYPES = [
  { label: 'Absent', value: 0 },
  { label: 'Half Day', value: 0.5 },
  { label: 'Full Day', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
];

export default function AttendanceTracker() {
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [attendanceData, setAttendanceData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setEmployees(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'attendance'),
      where('date', '==', selectedDate)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        const record = doc.data();
        data[record.employeeId] = record;
      });
      setAttendanceData(data);
    });

    return () => unsub();
  }, [selectedDate]);

  const handleAddEmployee = async () => {
    if (!newName.trim()) return;
    const newId = `emp_${Date.now()}`;
    const newEmployee = {
      id: newId,
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
    const numericValue = Number(value);
    const docId = `${empId}_${selectedDate}`;
    const attendanceRecord = {
      employeeId: empId,
      date: selectedDate,
      status: numericValue,
    };

    await setDoc(doc(db, 'attendance', docId), attendanceRecord);

    setAttendanceData((prev) => ({
      ...prev,
      [empId]: attendanceRecord,
    }));
  };

  return (
    <div className="tracker-wrapper">
      <div className="tracker-container">
        <h1 className="tracker-title">Attendance Tracker</h1>

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

        <div className="tracker-add-employee">
          <input
            type="text"
            placeholder="Add Employee"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button onClick={handleAddEmployee}>Add</button>
        </div>

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
                    <input
                      type="radio"
                      name={`attendance-${emp.id}-${selectedDate}`}
                      value={type.value}
                      checked={attendanceData[emp.id]?.status === type.value}
                      onChange={(e) =>
                        handleAttendanceChange(emp.id, e.target.value)
                      }
                      title={type.label}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}