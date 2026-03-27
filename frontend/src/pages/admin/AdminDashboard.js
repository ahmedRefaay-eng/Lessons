import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, Alert, Spinner } from '../../components/UI';

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/reports')
      .then((r) => setReports(r.data))
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const s = reports?.summary || {};

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '8px' }}>🛠️ Admin Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>System overview and quick actions</p>

      {error && <Alert type="error">{error}</Alert>}

      {/* Stats */}
      <div style={statsGrid}>
        <StatCard label="Total Students" value={s.studentCount || 0} color="#2563eb" icon="👨‍🎓" />
        <StatCard label="Total Exams" value={s.totalExams || 0} color="#7c3aed" icon="📝" />
        <StatCard label="Active Exams" value={s.activeExams || 0} color="#16a34a" icon="🟢" />
        <StatCard label="Present" value={s.presentCount || 0} color="#0891b2" icon="✅" />
        <StatCard label="Absent" value={s.absentCount || 0} color="#dc2626" icon="❌" />
        <StatCard label="Avg Grade" value={s.averageGrade ? `${s.averageGrade}%` : 'N/A'} color="#d97706" icon="📊" />
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: '1.2rem', color: '#111827', marginBottom: '16px' }}>Quick Actions</h2>
      <div style={statsGrid}>
        <ActionCard to="/admin/exams" label="📝 Manage Exams" desc="Create, edit, assign exams" color="#7c3aed" />
        <ActionCard to="/admin/lessons" label="📚 Manage Lessons" desc="Upload and manage lessons" color="#0891b2" />
        <ActionCard to="/admin/users" label="👥 Manage Users" desc="View and manage students" color="#2563eb" />
        <ActionCard to="/admin/attendance" label="📋 Attendance" desc="Monitor student attendance" color="#16a34a" />
        <ActionCard to="/admin/grades" label="📊 Grades" desc="Assign and view grades" color="#d97706" />
      </div>

      {/* Recent users */}
      {reports?.recentUsers?.length > 0 && (
        <Card>
          <h2 style={{ marginBottom: '16px', fontSize: '1.1rem', color: '#111827' }}>Recent Registrations</h2>
          {reports.recentUsers.slice(0, 5).map((u) => (
            <div key={u.id} style={rowStyle}>
              <div>
                <strong>{u.first_name || ''} {u.last_name || ''} {!u.first_name && !u.last_name ? u.email : ''}</strong>
                <span style={{ color: '#6b7280', fontSize: '0.85rem', marginLeft: '8px' }}>{u.email}</span>
              </div>
              <div>
                <span style={{ fontFamily: 'monospace', color: '#1e40af', fontSize: '0.85rem' }}>{u.student_id}</span>
                <span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '0.8rem' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}

function ActionCard({ to, label, desc, color }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
        <div style={{ fontWeight: 700, color, fontSize: '1rem' }}>{label}</div>
        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>{desc}</div>
      </div>
    </Link>
  );
}

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' };
