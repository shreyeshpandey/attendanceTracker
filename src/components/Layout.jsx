import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';
import '../styles/style.css';

export default function Layout() {
  const { signOut, user, role } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const routeTitles = {
    '/': 'Attendance Tracker',
    '/monthly-summary': 'Monthly Summary',
    '/manage-employees': 'Manage Employees',
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false); // Close sidebar on resize to desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return <Outlet />;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="layout-wrapper">
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          isMobile ? (isSidebarOpen ? 'mobile-visible' : 'mobile-hidden') : ''
        }`}
      >
        <h2 className="sidebar-title">Dashboard</h2>
        <nav className="nav-links">
          <Link
            to="/"
            onClick={isMobile ? closeSidebar : undefined}
            className={location.pathname === '/' ? 'active' : ''}
          >
            Attendance Tracker
          </Link>
          <Link
            to="/monthly-summary"
            onClick={isMobile ? closeSidebar : undefined}
            className={location.pathname === '/monthly-summary' ? 'active' : ''}
          >
            Monthly Summary
          </Link>
          {role === 'admin' && (
            <Link
              to="/manage-employees"
              onClick={isMobile ? closeSidebar : undefined}
              className={location.pathname === '/manage-employees' ? 'active' : ''}
            >
              Manage Employees
            </Link>
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="layout-main">
        <header className="topbar">
          {/* Hamburger only on mobile */}
          {isMobile && (
            <button className="menu-button" onClick={toggleSidebar}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          <div className="topbar-title">
            {routeTitles[location.pathname] || 'Dashboard'}
          </div>

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