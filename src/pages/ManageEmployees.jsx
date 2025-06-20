import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    site: '',
    rate: '',
    role: '',
  });

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
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
        setError('Failed to fetch employees');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    const { name, phone, site, rate, role } = form;
    if (!name || !phone || !site || !rate || !role) {
      alert('All fields are required');
      return;
    }

    if (isNaN(Number(rate))) {
      alert('Rate must be a number');
      return;
    }

    try {
      await addDoc(collection(db, 'employees'), form);
      setForm({ name: '', phone: '', site: '', rate: '', role: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add employee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete employee');
      }
    }
  };

  const startEdit = (emp) => {
    setEditId(emp.id);
    setEditForm(emp);
  };

  const handleSave = async () => {
    const { name, phone, site, rate, role } = editForm;
    if (!name || !phone || !site || !rate || !role) {
      alert('All fields are required');
      return;
    }

    if (isNaN(Number(rate))) {
      alert('Rate must be a number');
      return;
    }

    try {
      await updateDoc(doc(db, 'employees', editId), editForm);
      setEditId(null);
      setEditForm({});
    } catch (err) {
      console.error(err);
      alert('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setEditForm({});
  };

  const isAddDisabled = !form.name || !form.phone || !form.site || !form.rate || !form.role;

  return (
    <div className="manage-employees">
      <h2 className="page-title">Manage Employees</h2>

      {/* Add Form */}
      <div className="form-card">
        <h4 style={{ marginBottom: '0.5rem' }}>Add New Employee</h4>
        <div className="form-grid">
          {['name', 'phone', 'site', 'rate', 'role'].map((field) => (
            <input
              key={field}
              type="text"
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          ))}
          <button
            onClick={handleAdd}
            disabled={isAddDisabled}
            style={{ opacity: isAddDisabled ? 0.6 : 1 }}
          >
            Add
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading employees...</p>
      ) : employees.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No employees found.</p>
      ) : (
        <table className="employee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Site</th>
              <th>Rate</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                {editId === emp.id ? (
                  <>
                    {['name', 'phone', 'site', 'rate', 'role'].map((field) => (
                      <td key={field}>
                        <input
                          type="text"
                          value={editForm[field]}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              [field]: e.target.value,
                            })
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <button onClick={handleSave}>Save</button>
                      <button onClick={handleCancel}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{emp.name}</td>
                    <td>{emp.phone}</td>
                    <td>{emp.site}</td>
                    <td>{emp.rate}</td>
                    <td>{emp.role}</td>
                    <td>
                      <button onClick={() => startEdit(emp)}>Edit</button>
                      <button onClick={() => handleDelete(emp.id)}>
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}