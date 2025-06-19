import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../styles/style.css';
import { format } from 'date-fns';

export default function Layout() {
  const location = useLocation();
  const today = format(new Date(), 'dd MMM yyyy');

  return (
    <div className="layout-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">Dashboard</h2>
        <nav className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Attendance Tracker
          </Link>
          <Link
            to="/summary"
            className={location.pathname === '/summary' ? 'active' : ''}
          >
            Monthly Summary
          </Link>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-title">Attendance Tracker</div>
          <div className="topbar-date">{today}</div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}