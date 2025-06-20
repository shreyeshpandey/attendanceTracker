import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSiteFilter } from '../context/SiteFilterContext'; // 👈 NEW
import { Menu, X } from 'lucide-react';
import { db } from '../firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import '../styles/style.css';

export default function Layout() {
  const { signOut, user, role } = useAuth();
  const location = useLocation();
  const { siteFilter, setSiteFilter } = useSiteFilter(); // 👈 USE CONTEXT
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [siteOptions, setSiteOptions] = useState([]);

  const routeTitles = {
    '/': 'Attendance Tracker',
    '/monthly-summary': 'Monthly Summary',
    '/manage-employees': 'Manage Employees',
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔄 Load site list from employee collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const allSites = snapshot.docs.map((doc) => doc.data().site);
      const uniqueSites = [...new Set(allSites)];
      setSiteOptions(uniqueSites);
    });

    return () => unsub();
  }, []);

  if (!user) return <Outlet />;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="layout-wrapper">
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
          {/* Hamburger */}
          {isMobile && (
            <button className="menu-button" onClick={toggleSidebar}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          <div className="topbar-title">
            {routeTitles[location.pathname] || 'Dashboard'}
          </div>

          {/* 🔍 Global Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              background: 'white',
            }}
          >
            <option value="">All Sites</option>
            {siteOptions.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>

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