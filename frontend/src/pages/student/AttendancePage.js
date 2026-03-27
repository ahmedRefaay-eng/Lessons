import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Alert, Spinner, Table } from '../../components/UI';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/attendance/${user.id}`)
      .then((r) => setAttendance(r.data.attendance))
      .catch(() => setError('Failed to load attendance.'))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <Spinner />;

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;

  const columns = [
    { key: 'exam_title', label: 'Exam' },
    { key: 'exam_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <span style={{
          fontWeight: 700,
          color: v === 'present' ? '#16a34a' : '#dc2626',
          background: v === 'present' ? '#dcfce7' : '#fee2e2',
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '0.85rem',
        }}>
          {v === 'present' ? '✅ Present' : '❌ Absent'}
        </span>
      ),
    },
    { key: 'marked_at', label: 'Marked At', render: (v) => v ? new Date(v).toLocaleString() : '-' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '24px' }}>📋 My Attendance</h1>
      {error && <Alert type="error">{error}</Alert>}

      {absentCount > 3 && (
        <Alert type="error">
          ⚠️ You have <strong>{absentCount} absences</strong>. Administrators have been notified.
        </Alert>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <StatBox label="Present" value={presentCount} color="#16a34a" />
        <StatBox label="Absent" value={absentCount} color="#dc2626" />
        <StatBox label="Total" value={attendance.length} color="#2563eb" />
        {attendance.length > 0 && (
          <StatBox label="Rate" value={`${Math.round((presentCount / attendance.length) * 100)}%`} color="#7c3aed" />
        )}
      </div>

      <Card>
        <Table columns={columns} rows={attendance} emptyMessage="No attendance records." />
      </Card>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}
