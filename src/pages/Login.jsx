import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const docRef = doc(db, 'users', userCred.user.uid);
      const userDoc = await getDoc(docRef);

      if (!userDoc.exists()) throw new Error('User not found in database');
      if (!userDoc.data().approved) throw new Error('Account not approved by admin');

      localStorage.setItem('user', JSON.stringify(userDoc.data()));
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo192.png" alt="Logo" className="auth-logo" />
          <span className="auth-brand-name">Trackify</span>
        </div>

        <h2 className="auth-title">Login</h2>

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        {error && <p className="auth-message error">{error}</p>}

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}