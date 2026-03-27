import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <Link to="/" style={styles.brandLink}>🎓 Student Management</Link>
      </div>
      <div style={styles.links}>
        {user ? (
          <>
            {user.role === 'admin' ? (
              <>
                <Link to="/admin" style={styles.link}>Dashboard</Link>
                <Link to="/admin/exams" style={styles.link}>Exams</Link>
                <Link to="/admin/courses" style={styles.link}>Courses</Link>
                <Link to="/admin/lessons" style={styles.link}>Lessons</Link>
                <Link to="/admin/announcements" style={styles.link}>Announcements</Link>
                <Link to="/admin/users" style={styles.link}>Users</Link>
                <Link to="/admin/attendance" style={styles.link}>Attendance</Link>
                <Link to="/admin/grades" style={styles.link}>Grades</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                <Link to="/exams" style={styles.link}>Exams</Link>
                <Link to="/sessions" style={styles.link}>Courses</Link>
                <Link to="/lessons" style={styles.link}>Lessons</Link>
                <Link to="/grades" style={styles.link}>Grades</Link>
                <Link to="/attendance" style={styles.link}>Attendance</Link>
              </>
            )}
            <span style={styles.userName}>
              {user.first_name || user.email} ({user.role})
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '60px',
    background: '#1e40af',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: { fontWeight: 700, fontSize: '1.2rem' },
  brandLink: { color: '#fff', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  link: { color: '#bfdbfe', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 },
  userName: { color: '#93c5fd', fontSize: '0.85rem' },
  logoutBtn: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
};
