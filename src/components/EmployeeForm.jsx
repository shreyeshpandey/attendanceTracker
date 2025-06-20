import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function EmployeeForm({ selectedEmployee, onClose, onDelete }) {
  const isEditMode = !!selectedEmployee;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    site: '',
    rate: '',
    role: '',
  });

  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        name: selectedEmployee.name || '',
        phone: selectedEmployee.phone || '',
        site: selectedEmployee.site || '',
        rate: selectedEmployee.rate || '',
        role: selectedEmployee.role || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        site: '',
        rate: '',
        role: '',
      });
    }
  }, [selectedEmployee]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = isEditMode ? selectedEmployee.id : `emp_${Date.now()}`;
    const employeeData = { id, ...formData };

    await setDoc(doc(db, 'employees', id), employeeData);
    onClose();
  };

  return (
    <div className="form-container">
      <h3>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h3>
      <form onSubmit={handleSubmit} className="employee-form">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="site"
          placeholder="Site"
          value={formData.site}
          onChange={handleChange}
        />
        <input
          type="number"
          name="rate"
          placeholder="Rate"
          value={formData.rate}
          onChange={handleChange}
        />
        <input
          type="text"
          name="role"
          placeholder="Role"
          value={formData.role}
          onChange={handleChange}
        />

        <div className="form-buttons">
          <button type="submit" className="save-btn">
            {isEditMode ? 'Update' : 'Add'}
          </button>
          {isEditMode && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => onDelete(selectedEmployee.id)}
            >
              Delete
            </button>
          )}
          {isEditMode && (
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}