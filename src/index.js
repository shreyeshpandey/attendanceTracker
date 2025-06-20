import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import './styles/style.css';
import './styles/auth.css';

// Register service worker (for PWA support)
if ('serviceWorker' in navigator) {
 window.addEventListener('load', () => {
   navigator.serviceWorker.register('/service-worker.js')
     .then((reg) => console.log('✅ Service Worker registered', reg))
     .catch((err) => console.error('❌ Service Worker registration failed:', err));
 });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);