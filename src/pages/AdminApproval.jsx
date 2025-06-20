// AdminApproval.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function AdminApproval() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const pending = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === 'pending' && !user.approved);
      setPendingUsers(pending);
      setLoading(false);
    };

    fetchPending();
  }, []);

  const handleApprove = async (userId) => {
    await updateDoc(doc(db, 'users', userId), {
      role: 'viewer',
      approved: true,
    });
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleReject = async (userId) => {
    await updateDoc(doc(db, 'users', userId), {
      approved: false,
    });
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>;

  return (
    <div className="tracker-wrapper">
      <div className="tracker-container">
        <h2>Pending User Approvals</h2>
        {pendingUsers.length === 0 ? (
          <p>No pending users.</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <button onClick={() => handleApprove(user.id)}>Approve</button>
                    <button onClick={() => handleReject(user.id)} style={{ marginLeft: '1rem' }}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}