import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import './styles/style.css'; // Optional: only if using Tailwind
import './styles/auth.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);