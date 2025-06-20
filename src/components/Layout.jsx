import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../styles/style.css';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { signOut, user, role } = useAuth();
  const location = useLocation();
  const today = format(new Date(), 'dd MMM yyyy');

  // 🔓 If user is not logged in, skip layout (for /login or /register)
  if (!user) return <Outlet />;

  return (
    <div className="layout-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">Dashboard</h2>
        <nav className="nav-links">
          {/* Visible to all roles */}
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Attendance Tracker
          </Link>

          {/* Monthly Summary: visible to all roles */}
          <Link
            to="/monthly-summary"
            className={location.pathname === '/monthly-summary' ? 'active' : ''}
          >
            Monthly Summary
          </Link>

          {/* Admin only */}
          {role === 'admin' && (
            <Link
              to="/manage-employees"
              className={location.pathname === '/manage-employees' ? 'active' : ''}
            >
              Manage Employees
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Area */}
      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-title">Attendance Tracker</div>
          <div className="topbar-date">{today}</div>
          {user && (
            <button className="logout-button" onClick={signOut}>
              Logout
            </button>
          )}
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}