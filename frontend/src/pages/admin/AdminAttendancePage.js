import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Table } from '../../components/UI';

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [markForm, setMarkForm] = useState({ user_id: '', exam_id: '', status: 'present' });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const [attRes, examRes, userRes] = await Promise.all([
      api.get('/attendance'),
      api.get('/exams'),
      api.get('/admin/users?role=student'),
    ]);
    setAttendance(attRes.data.attendance);
    setExams(examRes.data.exams);
    setUsers(userRes.data.users);
  };

  useEffect(() => { load().catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }, []);

  const handleMark = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/attendance', markForm);
      setSuccess('Attendance marked.');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed.');
    }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'student_id', label: 'Student ID', render: (v) => <span style={{ fontFamily: 'monospace', color: '#1e40af' }}>{v}</span> },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'Name', render: (v, row) => `${v || ''} ${row.last_name || ''}`.trim() || '—' },
    { key: 'exam_title', label: 'Exam' },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <span style={{ color: v === 'present' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
          {v === 'present' ? '✅ Present' : '❌ Absent'}
        </span>
      ),
    },
    { key: 'marked_at', label: 'Marked At', render: (v) => v ? new Date(v).toLocaleString() : '-' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>📋 Attendance Records</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Mark Attendance'}</Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>Mark Attendance</h2>
          <form onSubmit={handleMark}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Student</label>
              <select style={selectStyle} value={markForm.user_id} onChange={(e) => setMarkForm({ ...markForm, user_id: parseInt(e.target.value) })} required>
                <option value="">Select student</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.first_name || ''} {u.last_name || ''} ({u.email}) — {u.student_id}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Exam</label>
              <select style={selectStyle} value={markForm.exam_id} onChange={(e) => setMarkForm({ ...markForm, exam_id: parseInt(e.target.value) })} required>
                <option value="">Select exam</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={markForm.status} onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={attendance} emptyMessage="No attendance records." />
      </Card>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' };
const selectStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem' };
