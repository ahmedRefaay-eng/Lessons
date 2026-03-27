import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card, Alert, Spinner } from '../../components/UI';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ grades: [], attendance: [], lessons: [], announcements: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesRes, attendanceRes, lessonsRes, announcementsRes, coursesRes] = await Promise.all([
          api.get(`/grades/${user.id}`),
          api.get(`/attendance/${user.id}`),
          api.get('/lessons'),
          api.get('/announcements'),
          api.get('/courses'),
        ]);
        setData({
          grades: gradesRes.data.grades,
          attendance: attendanceRes.data.attendance,
          lessons: lessonsRes.data.lessons,
          announcements: announcementsRes.data.announcements,
          courses: coursesRes.data.courses,
        });
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  if (loading) return <Spinner />;

  const presentCount = data.attendance.filter((a) => a.status === 'present').length;
  const absentCount = data.attendance.filter((a) => a.status === 'absent').length;
  const avgGrade =
    data.grades.length > 0
      ? (data.grades.reduce((s, g) => s + parseFloat(g.grade), 0) / data.grades.length).toFixed(1)
      : null;

  return (
    <div style={pageStyle}>
      <h1 style={headerStyle}>Welcome back, {user.first_name || user.email}! 👋</h1>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>
        Your Student ID: <strong style={{ color: '#1e40af', fontFamily: 'monospace', fontSize: '1.1rem' }}>{user.student_id}</strong>
      </p>
      <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '24px' }}>
        ⚠️ Keep your Student ID safe — you need it to access exams.
      </p>

      {error && <Alert type="error">{error}</Alert>}

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ ...sectionTitle, marginBottom: '12px' }}>📢 Announcements</h2>
          {data.announcements.slice(0, 3).map((ann) => (
            <div key={ann.id} style={announcementCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ color: '#1e40af', fontSize: '1rem' }}>{ann.title}</strong>
                <span style={{ color: '#9ca3af', fontSize: '0.78rem', flexShrink: 0, marginLeft: '12px' }}>
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ color: '#374151', margin: '6px 0 0', fontSize: '0.9rem', lineHeight: 1.6 }}>{ann.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={statsGrid}>
        <StatCard label="Total Exams" value={data.attendance.length} color="#2563eb" icon="📋" />
        <StatCard label="Present" value={presentCount} color="#16a34a" icon="✅" />
        <StatCard label="Absent" value={absentCount} color="#dc2626" icon="❌" />
        <StatCard label="Avg Grade" value={avgGrade ? `${avgGrade}%` : 'N/A'} color="#7c3aed" icon="📊" />
        <StatCard label="Courses" value={data.courses.length} color="#0891b2" icon="🗂️" />
      </div>

      {/* Quick Links */}
      <div style={statsGrid}>
        <QuickLink to="/exams" label="📝 Start Exam" desc="Access your exams" color="#1e40af" />
        <QuickLink to="/sessions" label="🗂️ Courses & Sessions" desc="Structured study materials" color="#7c3aed" />
        <QuickLink to="/lessons" label="📚 Lessons" desc="All lesson materials" color="#0891b2" />
        <QuickLink to="/grades" label="📊 My Grades" desc="Check your grades" color="#16a34a" />
        <QuickLink to="/attendance" label="📋 Attendance" desc="Attendance record" color="#d97706" />
      </div>

      {/* Recent grades */}
      {data.grades.length > 0 && (
        <Card>
          <h2 style={sectionTitle}>Recent Grades</h2>
          {data.grades.slice(0, 5).map((g) => (
            <div key={g.id} style={rowStyle}>
              <span>{g.exam_title}</span>
              <span style={{ fontWeight: 700, color: parseFloat(g.grade) >= 50 ? '#16a34a' : '#dc2626' }}>
                {parseFloat(g.grade).toFixed(1)}%
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ ...cardBase, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function QuickLink({ to, label, desc, color }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{ ...cardBase, borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
        <div style={{ fontWeight: 700, color, fontSize: '1rem' }}>{label}</div>
        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>{desc}</div>
      </div>
    </Link>
  );
}

const pageStyle = { padding: '24px', maxWidth: '1200px', margin: '0 auto' };
const headerStyle = { fontSize: '1.8rem', color: '#111827', marginBottom: '4px' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' };
const sectionTitle = { marginBottom: '16px', color: '#111827', fontSize: '1.1rem' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' };
const cardBase = { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' };
const announcementCard = { background: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '10px', borderLeft: '4px solid #2563eb' };
