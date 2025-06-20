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

  // 🔁 Real-time employee fetch
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEmployees(data);
    });
    return () => unsub();
  }, []);

  // ➕ Add employee
  const handleAdd = async () => {
    if (!form.name.trim()) return alert('Name is required');
    await addDoc(collection(db, 'employees'), form);
    setForm({ name: '', phone: '', site: '', rate: '', role: '' });
  };

  // ❌ Delete employee
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      await deleteDoc(doc(db, 'employees', id));
    }
  };

  // 📝 Enable edit mode
  const startEdit = (emp) => {
    setEditId(emp.id);
    setEditForm(emp);
  };

  // ✅ Save edited employee
  const handleSave = async () => {
    await updateDoc(doc(db, 'employees', editId), editForm);
    setEditId(null);
    setEditForm({});
  };

  // 🔙 Cancel editing
  const handleCancel = () => {
    setEditId(null);
    setEditForm({});
  };

  return (
    <div className="manage-employees">
      <h2>Manage Employees</h2>

      {/* Add Form */}
      <div className="form-card">
        <h4>Add Employee</h4>
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
          <button onClick={handleAdd}>Add</button>
        </div>
      </div>

      {/* Employee Table */}
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
                          setEditForm({ ...editForm, [field]: e.target.value })
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
                    <button onClick={() => handleDelete(emp.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}